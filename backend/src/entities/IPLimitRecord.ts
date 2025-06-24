export class IPLimitRecord {
  constructor(
    public readonly id: string,
    public readonly ipAddress: string,
    public readonly lastRequestDate: string, // YYYY-MM-DD 형식
    public readonly requestCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    ipAddress: string,
    lastRequestDate: string,
    requestCount: number,
  ): IPLimitRecord {
    const now = new Date();
    return new IPLimitRecord(
      id,
      ipAddress,
      lastRequestDate,
      requestCount,
      now,
      now,
    );
  }

  public incrementCount(): IPLimitRecord {
    return new IPLimitRecord(
      this.id,
      this.ipAddress,
      this.lastRequestDate,
      this.requestCount + 1,
      this.createdAt,
      new Date(),
    );
  }

  public updateDate(newDate: string): IPLimitRecord {
    return new IPLimitRecord(
      this.id,
      this.ipAddress,
      newDate,
      1, // 새로운 날이므로 카운트 초기화
      this.createdAt,
      new Date(),
    );
  }

  public validate(): void {
    if (!this.ipAddress) {
      throw new Error('IP 주소는 필수입니다.');
    }

    if (!this.lastRequestDate) {
      throw new Error('마지막 요청 날짜는 필수입니다.');
    }

    if (this.requestCount < 0) {
      throw new Error('요청 횟수는 음수일 수 없습니다.');
    }

    // YYYY-MM-DD 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.lastRequestDate)) {
      throw new Error('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
    }
  }
} 