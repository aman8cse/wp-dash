import type { FC } from "react";

export const Footer: FC = () => {
    return (
        <footer>
            <div className="flex min-h-14 flex-wrap items-center justify-center border-t border-border bg-surface px-3 py-3 transition-colors sm:min-h-16 sm:px-6">
                <h1 className="text-sm font-bold text-text-primary sm:text-base">
                    Developed by Aman Agrahari
                </h1>

                <span
                    className="mx-2 h-2.5 w-2.5 shrink-0 rounded-full bg-wind animate-breathe sm:mx-3"
                />

                <a
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary sm:text-base"
                    href="https://aman8cse.engineer"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Visit Portfolio
                </a>
            </div>
        </footer>
    );
};