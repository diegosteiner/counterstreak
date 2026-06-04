// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    // Not part of the standard DOM lib; fired by Chromium when the PWA is installable.
    interface BeforeInstallPromptEvent extends Event {
        prompt(): Promise<void>;
        readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    }

    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export {};
