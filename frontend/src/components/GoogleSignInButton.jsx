import {
  useEffect,
  useRef,
  useState,
} from "react";


const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;


/*
 * Google Identity Services script'i index.html'de yüklenir.
 * Bu bileşen VITE_GOOGLE_CLIENT_ID tanımlı değilse hiçbir şey
 * göstermez (Google girişi henüz yapılandırılmamış demektir).
 */
function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" &&
    !!window.google?.accounts?.id
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);


  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || scriptReady) {
      return;
    }

    let cancelled = false;

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);

        if (!cancelled) {
          setScriptReady(true);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [scriptReady]);


  useEffect(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      !scriptReady ||
      !buttonRef.current
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,

      callback: (response) => {
        onCredentialRef.current?.(
          response.credential
        );
      },
    });

    const width = Math.min(
      400,
      Math.max(
        220,
        buttonRef.current.offsetWidth || 320
      )
    );

    window.google.accounts.id.renderButton(
      buttonRef.current,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        locale: "tr",
        width,
      }
    );
  }, [scriptReady]);


  if (!GOOGLE_CLIENT_ID) {
    return null;
  }


  return (
    <div className="google-signin-wrapper">

      <div className="auth-divider">
        <span>veya</span>
      </div>

      <div
        ref={buttonRef}
        className="google-signin-button"
      />

    </div>
  );
}


export default GoogleSignInButton;
