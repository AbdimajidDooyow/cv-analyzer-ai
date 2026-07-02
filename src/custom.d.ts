declare module '*.css';
declare module '*.scss';
declare module '*.module.css';
declare module '*.module.scss';

declare module 'react-dom/client' {
  export * from 'react-dom';
}

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
