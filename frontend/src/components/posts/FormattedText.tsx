interface FormattedTextProps {
    text: string;
    onClick?: () => void;
}

export function FormattedText({ text, onClick }: FormattedTextProps) {
    return (
        <p
            className="post-body"
            onClick={onClick}
            title={onClick ? "Cliquer pour lire la suite" : undefined}
        >
            {text.split(" ").map((word, i) => {
                if (word.startsWith("#"))
                    return <span key={i} className="post-hashtag">{word} </span>;
                if (word.startsWith("@"))
                    return <span key={i} style={{ color: "var(--ink-purple)", fontWeight: 700 }}>{word} </span>;
                return word + " ";
            })}
        </p>
    );
}
