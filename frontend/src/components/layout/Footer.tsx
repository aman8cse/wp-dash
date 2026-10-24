import type { FC } from "react";

export const Footer: FC = () => {
    return (
        <footer>
            <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-center sticky top-0 z-30 transition-colors">
                <h1 className="text-base font-bold text-text-primary">
                    Developed by Aman Agrahari
                </h1>

                <span
                    className="mx-3 h-2.5 w-2.5 rounded-full shrink-0 animate-breathe"
                    style={{ backgroundColor: "#32af26" }}
                />

                <a
                    className="text-base text-text-secondary hover:text-text-primary transition-colors"
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