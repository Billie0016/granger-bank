import "server-only";
import { ProviderNotConfiguredError } from "../security/errors";
import type {
  AccountProvider,
  BankingProvider,
  CardProvider,
  EmailProvider,
  FraudRiskProvider,
  KycProvider,
  PaymentProvider,
  TransactionProvider,
} from "./types";

/**
 * Fail-closed implementations. These are the ONLY implementations available
 * outside local development until a real, authorized provider is
 * configured (Phase 10). Every method throws ProviderNotConfiguredError
 * (HTTP 503, "this feature isn't available yet") rather than fabricating a
 * result. See docs/production/06-banking-provider-integration.md
 * §"Fail-closed behavior".
 *
 * This is deliberate and load-bearing: it is the mechanism, not just a
 * policy statement, that prevents this codebase from ever pretending a
 * transfer succeeded, a balance changed, or a KYC check passed.
 */

export class UnconfiguredBankingProvider implements BankingProvider {
  readonly name = "unconfigured-banking";
  async openAccount(): Promise<never> {
    throw new ProviderNotConfiguredError("BankingProvider");
  }
  async closeAccount(): Promise<never> {
    throw new ProviderNotConfiguredError("BankingProvider");
  }
  async getAccountStatus(): Promise<never> {
    throw new ProviderNotConfiguredError("BankingProvider");
  }
}

export class UnconfiguredAccountProvider implements AccountProvider {
  readonly name = "unconfigured-account";
  async getBalance(): Promise<never> {
    throw new ProviderNotConfiguredError("AccountProvider");
  }
  async listTransactions(): Promise<never> {
    throw new ProviderNotConfiguredError("AccountProvider");
  }
}

export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly name = "unconfigured-payment";
  async submitTransfer(): Promise<never> {
    throw new ProviderNotConfiguredError("PaymentProvider");
  }
  async getTransferStatus(): Promise<never> {
    throw new ProviderNotConfiguredError("PaymentProvider");
  }
  verifyWebhookSignature(): boolean {
    // Fails closed: an unconfigured provider trusts no webhook.
    return false;
  }
}

export class UnconfiguredTransactionProvider implements TransactionProvider {
  readonly name = "unconfigured-transaction";
  async listUnprocessedEvents(): Promise<never> {
    throw new ProviderNotConfiguredError("TransactionProvider");
  }
  async acknowledgeEvent(): Promise<never> {
    throw new ProviderNotConfiguredError("TransactionProvider");
  }
}

export class UnconfiguredCardProvider implements CardProvider {
  readonly name = "unconfigured-card";
  async issueCard(): Promise<never> {
    throw new ProviderNotConfiguredError("CardProvider");
  }
  async freezeCard(): Promise<never> {
    throw new ProviderNotConfiguredError("CardProvider");
  }
  async unfreezeCard(): Promise<never> {
    throw new ProviderNotConfiguredError("CardProvider");
  }
  async cancelCard(): Promise<never> {
    throw new ProviderNotConfiguredError("CardProvider");
  }
}

export class UnconfiguredKycProvider implements KycProvider {
  readonly name = "unconfigured-kyc";
  async startVerification(): Promise<never> {
    throw new ProviderNotConfiguredError("KycProvider");
  }
  async getVerificationStatus(): Promise<never> {
    throw new ProviderNotConfiguredError("KycProvider");
  }
}

export class UnconfiguredFraudRiskProvider implements FraudRiskProvider {
  readonly name = "unconfigured-fraud";
  async scoreTransaction(): Promise<never> {
    throw new ProviderNotConfiguredError("FraudRiskProvider");
  }
  async scoreLogin(): Promise<never> {
    throw new ProviderNotConfiguredError("FraudRiskProvider");
  }
}

export class UnconfiguredEmailProvider implements EmailProvider {
  readonly name = "unconfigured-email";
  async send(): Promise<never> {
    throw new ProviderNotConfiguredError("EmailProvider");
  }
}
