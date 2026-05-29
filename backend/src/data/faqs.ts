export type FaqItem = {
  id: string;
  category: 'PAYMENT' | 'DOCUMENT' | 'CHAT' | 'ACCOUNT' | 'SERVICE';
  question: string;
  answer: string;
};

export const FAQS: FaqItem[] = [
  {
    id: 'faq_payment_1',
    category: 'PAYMENT',
    question: '결제했는데 결과가 바로 안 보일 수 있나요?',
    answer:
      '결제 직후에는 리포트 생성과 연결 작업이 몇 초 정도 걸릴 수 있습니다. 잠시만 기다리면 결과 화면이 자동으로 갱신됩니다. 계속 지연되면 구매내역에서 다시 확인해 주세요.',
  },
  {
    id: 'faq_payment_2',
    category: 'PAYMENT',
    question: '무료 이용 내역도 구매내역에 나오나요?',
    answer:
      '아니요. 무료 체험이나 무료 홍시 같은 0원 이용 내역은 구매내역 목록에서 숨기고 있습니다.',
  },
  {
    id: 'faq_document_1',
    category: 'DOCUMENT',
    question: '이미 본 사주/신년운세 문서를 다시 볼 수 있나요?',
    answer:
      '문서 유효기간 안이라면 기존 결과를 다시 볼 수 있습니다. 같은 문서형 상품을 결제하려고 할 때 기존 문서가 있으면 바로 보기 경로를 함께 안내합니다.',
  },
  {
    id: 'faq_document_2',
    category: 'DOCUMENT',
    question: '문서 결과에서 채팅으로 이어볼 수 있나요?',
    answer:
      '네. 문서 결과를 바탕으로 채팅 상담을 이어갈 수 있습니다. 채팅은 별도 상담 상품이며, 문서 전체가 아니라 핵심 흐름을 기반으로 후속 상담이 진행됩니다.',
  },
  {
    id: 'faq_chat_1',
    category: 'CHAT',
    question: '채팅 상담은 어떤 방식으로 이어지나요?',
    answer:
      '같은 카테고리에서 진행 중인 활성 채팅 세션이 있으면 그 세션으로 이어지고, 없으면 새 상담 세션이 시작됩니다.',
  },
  {
    id: 'faq_chat_2',
    category: 'CHAT',
    question: '손금 상담은 사진을 저장하나요?',
    answer:
      '아니요. 손금 이미지는 서버가 분석용으로만 메모리에서 처리하고 별도로 저장하지 않습니다.',
  },
  {
    id: 'faq_account_1',
    category: 'ACCOUNT',
    question: '채팅 내역과 구매내역은 로그인해야 볼 수 있나요?',
    answer:
      '네. 채팅 세션과 구매 정보는 계정 기준으로 관리되므로, 로그인한 상태에서만 내역을 정확하게 확인할 수 있습니다.',
  },
  {
    id: 'faq_service_1',
    category: 'SERVICE',
    question: '건의사항이나 제휴문의는 어디로 보내면 되나요?',
    answer:
      '건의사항과 제휴문의는 카카오톡 채널로 받고 있습니다. 설정 화면의 건의사항/제휴문의 메뉴를 통해 바로 연결할 수 있습니다.',
  },
];
