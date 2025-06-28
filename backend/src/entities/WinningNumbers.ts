import { WinningNumbers as WinningNumbersType } from '@/types/common';

export class WinningNumbers {
  constructor(
    public readonly id: string,
    public readonly round: number,
    public readonly numbers: WinningNumbersType,
    public readonly bonusNumber: number,
    public readonly firstWinningAmount: bigint,
    public readonly drawDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: string,
    round: number,
    numbers: WinningNumbersType,
    bonusNumber: number,
    firstWinningAmount: bigint,
    drawDate: Date,
  ): WinningNumbers {
    const now = new Date();
    return new WinningNumbers(id, round, numbers, bonusNumber, firstWinningAmount, drawDate, now, now);
  }

  public validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('ID는 필수입니다.');
    }

    if (this.round < 1 || this.round > 9999) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }

    if (!this.numbers || this.numbers.length !== 6) {
      throw new Error('당첨번호는 6개여야 합니다.');
    }

    this.numbers.forEach((num, index) => {
      if (num < 1 || num > 45) {
        throw new Error(
          `당첨번호는 1-45 사이여야 합니다. 잘못된 번호: ${num} (위치: ${index + 1})`,
        );
      }
    });

    // 중복 번호 확인
    const uniqueNumbers = new Set(this.numbers);
    if (uniqueNumbers.size !== 6) {
      throw new Error('당첨번호에 중복된 번호가 있습니다.');
    }

    if (this.bonusNumber < 1 || this.bonusNumber > 45) {
      throw new Error('보너스 번호는 1-45 사이여야 합니다.');
    }

    if (this.numbers.includes(this.bonusNumber)) {
      throw new Error('보너스 번호는 당첨번호와 중복될 수 없습니다.');
    }

    if (this.firstWinningAmount < 0n) {
      throw new Error('1등 당첨금은 0 이상이어야 합니다.');
    }

    if (!this.drawDate) {
      throw new Error('추첨일은 필수입니다.');
    }

    if (this.drawDate > new Date()) {
      throw new Error('추첨일은 미래일 수 없습니다.');
    }
  }

  public getMainNumbers(): number[] {
    return [...this.numbers].sort((a, b) => a - b);
  }

  public getBonusNumber(): number {
    return this.bonusNumber;
  }

  public getAllNumbersSorted(): number[] {
    return [...this.numbers, this.bonusNumber].sort((a, b) => a - b);
  }

  public hasNumber(number: number): boolean {
    return this.numbers.includes(number) || this.bonusNumber === number;
  }

  public countMatches(userNumbers: number[]): number {
    return userNumbers.filter(num => this.numbers.includes(num)).length;
  }

  public countMatchesWithBonus(userNumbers: number[]): {
    mainMatches: number;
    bonusMatch: boolean;
  } {
    const mainMatches = userNumbers.filter(num => this.numbers.includes(num)).length;
    const bonusMatch = userNumbers.includes(this.bonusNumber);

    return { mainMatches, bonusMatch };
  }

  public calculateGrade(userNumbers: number[]): string {
    const { mainMatches, bonusMatch } = this.countMatchesWithBonus(userNumbers);

    if (mainMatches === 6) {
      return '1등';
    } else if (mainMatches === 5 && bonusMatch) {
      return '2등';
    } else if (mainMatches === 5) {
      return '3등';
    } else if (mainMatches === 4) {
      return '4등';
    } else if (mainMatches === 3) {
      return '5등';
    } else {
      return '낙첨';
    }
  }

  public getFormattedNumbers(): string {
    const mainNumbers = this.getMainNumbers();
    return `${mainNumbers.join(', ')} + ${this.bonusNumber}`;
  }
} 