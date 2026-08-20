export class InvalidTimeRangeError extends Error {
  override readonly name = "InvalidTimeRangeError";

  constructor(startMinute: number, endMinute: number) {
    super(`Invalid time range: ${startMinute}..${endMinute}`);
  }
}

export class TimeRange {
  private constructor(
    readonly startMinute: number,
    readonly endMinute: number,
  ) {}

  static from(startMinute: number, endMinute: number): TimeRange {
    if (startMinute >= endMinute) {
      throw new InvalidTimeRangeError(startMinute, endMinute);
    }

    return new TimeRange(startMinute, endMinute);
  }

  overlaps(other: TimeRange): boolean {
    return (
      this.startMinute <= other.endMinute &&
      other.startMinute <= this.endMinute
    );
  }
}
