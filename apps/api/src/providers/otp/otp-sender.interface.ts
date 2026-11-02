export interface OtpSender {
  /**
   * Send an OTP verification code to a customer email address.
   */
  send(email: string, code: string): Promise<void>;
}
