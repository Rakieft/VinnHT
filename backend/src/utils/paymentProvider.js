const providerName = () => process.env.PAYMENT_PROVIDER || "simulated";

export const paymentProvider = {
  name: providerName(),

  async simulate({ orderId, status }) {
    const paid = status === "paid";
    return {
      provider: providerName(),
      status,
      reference: paid ? `SIM-${orderId}-${Date.now()}` : null,
      paid,
    };
  },

  async createPaymentIntent() {
    if (providerName() !== "moncash") {
      return {
        provider: providerName(),
        status: "pending",
        redirectUrl: null,
        reference: null,
      };
    }

    throw new Error("MonCash n'est pas encore configuré pour cet environnement.");
  },
};
