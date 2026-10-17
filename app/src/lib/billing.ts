import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

/** Droit RevenueCat qui débloque Dicta Pro (même nom côté webhook). */
export const PRO_ENTITLEMENT = 'pro';

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** false tant que les clés RevenueCat ne sont pas configurées (ou sur le web). */
export const billingAvailable = Boolean(apiKey);

let configured = false;

/**
 * Lie les achats au compte Supabase : le webhook retrouve l'utilisateur grâce à cet identifiant.
 * Dans Expo Go, RevenueCat passe tout seul en mode simulé (pas de vrai achat).
 */
export async function identifyBilling(userId: string) {
  if (!apiKey) return;
  if (!configured) {
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } else {
    await Purchases.logIn(userId);
  }
}

export async function resetBilling() {
  if (configured) await Purchases.logOut().catch(() => {});
}

export const hasPro = (info: CustomerInfo) => Boolean(info.entitlements.active[PRO_ENTITLEMENT]);

export async function getProPackage(): Promise<PurchasesPackage | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
}

/** true si l'achat a débloqué Pro, false si l'utilisateur a annulé. */
export async function purchasePro(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restorePro() {
  return hasPro(await Purchases.restorePurchases());
}

export function onProChange(listener: (pro: boolean) => void) {
  if (!configured) return () => {};
  const handler = (info: CustomerInfo) => listener(hasPro(info));
  Purchases.addCustomerInfoUpdateListener(handler);
  Purchases.getCustomerInfo().then(handler, () => {});
  return () => {
    Purchases.removeCustomerInfoUpdateListener(handler);
  };
}
