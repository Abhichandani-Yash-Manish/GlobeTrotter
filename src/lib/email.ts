type PasswordRecoveryMessage = {
  recipient: string;
  resetUrl: string;
};

export interface EmailProvider {
  sendPasswordRecovery(message: PasswordRecoveryMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendPasswordRecovery({ recipient, resetUrl }: PasswordRecoveryMessage) {
    console.info(`[GlobeTrotter recovery] ${recipient}: ${resetUrl}`);
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();

