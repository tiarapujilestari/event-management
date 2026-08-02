import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

interface Props {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

export default function GoogleSignInButton({ onCredential, disabled }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes("your_google_client_id") || disabled)
      return;

    function render() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "pill",
      });
    }

    // The GSI script loads async — poll briefly until window.google is available
    if (window.google) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          render();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const notConfigured = !clientId || clientId.includes("your_google_client_id");

  if (notConfigured) {
    return (
      <button
        type="button"
        disabled
        title="Google Sign-In is not configured yet — set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID"
        className="btn-secondary w-full !cursor-not-allowed opacity-50"
      >
        Continue with Google
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center w-full" />;
}
