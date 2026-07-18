const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_PROVIDERS = new Set(['EMAIL', 'KAKAO', 'GOOGLE', 'NAVER']);

function parseArgs(argv) {
  const args = {
    yes: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--yes') {
      args.yes = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`알 수 없는 인수입니다: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new Error(`${arg} 값이 필요합니다.`);
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function printUsage() {
  console.log(`
관리자 권한 승격 스크립트

사용법:
  npm run admin:promote -- --user-id <USER_ID>
  npm run admin:promote -- --provider GOOGLE --nickname "김창열"
  npm run admin:promote -- --provider GOOGLE --provider-uid <PROVIDER_UID>
  npm run admin:promote -- --email user@example.com

옵션:
  --yes              실제로 USER -> ADMIN 변경
  --user-id          users.id 기준으로 정확히 한 명 선택
  --provider         EMAIL, KAKAO, GOOGLE, NAVER
  --provider-uid     social_accounts.providerUid 기준 필터
  --nickname         users.nickname 기준 필터
  --email            users.email 기준 필터

기본 동작:
  --yes 없으면 dry-run만 수행합니다.
  대상이 없거나 여러 명이면 변경하지 않습니다.
`);
}

function normalizeProvider(provider) {
  if (!provider) return undefined;

  const normalized = provider.toUpperCase();
  if (!VALID_PROVIDERS.has(normalized)) {
    throw new Error(`지원하지 않는 provider입니다: ${provider}`);
  }

  return normalized;
}

function buildWhere(args) {
  if (args['user-id']) {
    return {
      id: args['user-id'],
      deletedAt: null,
    };
  }

  const provider = normalizeProvider(args.provider);
  const where = {
    deletedAt: null,
  };

  if (args.email) {
    where.email = args.email;
  }

  if (args.nickname) {
    where.nickname = args.nickname;
  }

  if (provider) {
    where.socialAccounts = {
      some: {
        provider,
        ...(args['provider-uid'] ? { providerUid: args['provider-uid'] } : {}),
      },
    };
  }

  return where;
}

function assertEnoughSelector(args) {
  if (args['user-id']) return;
  if (args.email) return;
  if (args.provider && args['provider-uid']) return;
  if (args.provider && args.nickname) return;

  throw new Error('대상 계정을 좁힐 선택자가 필요합니다. --user-id, --email, --provider + --provider-uid, 또는 --provider + --nickname을 사용하세요.');
}

function maskEmail(email) {
  if (!email) return null;

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return null;

  return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
}

function summarizeUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    email: maskEmail(user.email),
    role: user.role,
    socialProviders: user.socialAccounts.map((account) => account.provider),
    createdAt: user.createdAt,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    return;
  }

  assertEnoughSelector(args);

  const where = buildWhere(args);
  const candidates = await prisma.user.findMany({
    where,
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true,
      createdAt: true,
      socialAccounts: {
        select: {
          provider: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (candidates.length === 0) {
    console.error('대상 사용자를 찾지 못했습니다.');
    console.error('먼저 해당 소셜 계정으로 한 번 로그인해서 users/social_accounts 레코드를 생성하세요.');
    process.exitCode = 1;
    return;
  }

  if (candidates.length > 1) {
    console.error(`대상 사용자가 ${candidates.length}명입니다. 더 정확한 선택자를 사용하세요.`);
    console.log(JSON.stringify(candidates.map(summarizeUser), null, 2));
    process.exitCode = 1;
    return;
  }

  const target = candidates[0];
  console.log('대상 사용자:');
  console.log(JSON.stringify(summarizeUser(target), null, 2));

  if (target.role === 'ADMIN') {
    console.log('이미 ADMIN 권한을 가진 사용자입니다. 변경하지 않습니다.');
    return;
  }

  if (!args.yes) {
    console.log('');
    console.log('dry-run입니다. 실제 승격하려면 같은 명령에 --yes를 추가하세요.');
    return;
  }

  const promoted = await prisma.user.update({
    where: { id: target.id },
    data: { role: 'ADMIN' },
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true,
      createdAt: true,
      socialAccounts: {
        select: {
          provider: true,
          createdAt: true,
        },
      },
    },
  });

  console.log('');
  console.log('관리자 승격 완료:');
  console.log(JSON.stringify(summarizeUser(promoted), null, 2));
}

main()
  .catch((error) => {
    console.error('관리자 승격 실패:', error.message || error);
    printUsage();
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
