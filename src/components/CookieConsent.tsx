"use client";

import { useEffect } from "react";

/**
 * Bridge to vanilla-cookieconsent (Orest Bida, MIT). The lib mounts its own DOM
 * via `run()`; this component just initialises it once on the client and lets
 * the rest of the app open the preferences modal through `openCookiePreferences`.
 *
 * Categories:
 * - necessary: locked ON. Supabase session cookies + Stripe Checkout return.
 *   Required for auth/booking to work, exempt from CNIL consent.
 * - analytics: opt-in, empty for now. Wire Plausible / GA behind a
 *   `cc.acceptedCategory('analytics')` check when we add a tracker.
 */
export default function CookieConsent() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cc = await import("vanilla-cookieconsent");
      await import("vanilla-cookieconsent/dist/cookieconsent.css");
      // ARKO brand overrides — imported AFTER the lib CSS so it wins the cascade.
      await import("./cookieconsent-arko.css");

      if (cancelled) return;

      await cc.run({
        guiOptions: {
          consentModal: { layout: "box", position: "bottom right" },
          preferencesModal: { layout: "box" },
        },
        categories: {
          necessary: { enabled: true, readOnly: true },
          analytics: {},
        },
        language: {
          default: "fr",
          translations: {
            fr: {
              consentModal: {
                title: "On respecte votre vie privée",
                description:
                  'ARKO utilise uniquement des cookies strictement nécessaires (session, paiement) pour faire fonctionner le site. Aucun tracker tiers n\'est posé sans votre accord. <a href="/confidentialite">En savoir plus</a>.',
                acceptAllBtn: "Tout accepter",
                acceptNecessaryBtn: "Tout refuser",
                showPreferencesBtn: "Personnaliser",
              },
              preferencesModal: {
                title: "Préférences cookies",
                acceptAllBtn: "Tout accepter",
                acceptNecessaryBtn: "Tout refuser",
                savePreferencesBtn: "Enregistrer mes choix",
                closeIconLabel: "Fermer",
                sections: [
                  {
                    title: "À propos de ces cookies",
                    description:
                      "Vous pouvez activer ou désactiver les catégories optionnelles. Les cookies strictement nécessaires restent toujours actifs car ils permettent à ARKO de fonctionner (connexion à votre compte, finalisation d'une réservation).",
                  },
                  {
                    title: "Strictement nécessaires",
                    description:
                      "Cookies de session Supabase (authentification) et redirection Stripe Checkout. Sans eux, impossible de se connecter ou de payer une garde.",
                    linkedCategory: "necessary",
                  },
                  {
                    title: "Mesure d'audience (optionnel)",
                    description:
                      "Si activé, nous mesurerons l'usage du site de manière anonyme pour l'améliorer. Aucun tracker n'est actuellement déployé — cette case existe pour préparer l'avenir.",
                    linkedCategory: "analytics",
                  },
                  {
                    title: "En savoir plus",
                    description:
                      'Voir la <a href="/confidentialite">politique de confidentialité</a> pour le détail.',
                  },
                ],
              },
            },
          },
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

/**
 * Open the preferences modal from anywhere (e.g. a "Gérer les cookies" link in
 * the footer). No-op on the server and before the lib has initialised.
 */
export async function openCookiePreferences() {
  if (typeof window === "undefined") return;
  const cc = await import("vanilla-cookieconsent");
  cc.showPreferences();
}
