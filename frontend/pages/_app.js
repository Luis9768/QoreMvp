import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>QA Autonomous Copilot | Next.js + C# + Gemini</title>
        <meta name="description" content="Plataforma inteligente de testes E2E com IA" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
