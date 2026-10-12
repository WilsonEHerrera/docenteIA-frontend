/**
 * Editorial quotes shown on the home screen. `kind` keeps the UI honest about each one:
 *  - "cita": wording documented in a known work or speech (shown in « »).
 *  - "atribuida": circulates widely but no primary source is traceable (shown as "Atribuida a").
 *  - "parafrasis": an adaptation of the author's idea, not their literal words (shown without « »).
 * Translations into Spanish are the usual ones, not the authors' original language.
 */
export type QuoteKind = "cita" | "atribuida" | "parafrasis";

export interface EducationQuote {
  text: string;
  author: string;
  kind: QuoteKind;
  /** Work or occasion, when known. */
  source?: string;
}

export const EDUCATION_QUOTES: readonly EducationQuote[] = [
  {
    text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
    author: "Nelson Mandela",
    kind: "cita",
    source: "discurso de 2003",
  },
  {
    text: "La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo.",
    author: "Paulo Freire",
    kind: "atribuida",
  },
  {
    text: "La educación es el pasaporte hacia el futuro.",
    author: "Malcolm X",
    kind: "cita",
    source: "discurso de 1964",
  },
  {
    text: "El aprendizaje nunca agota la mente.",
    author: "Leonardo da Vinci",
    kind: "atribuida",
  },
  {
    text: "La educación consiste en ayudar a una persona a llevar a la realidad sus aptitudes.",
    author: "Erich Fromm",
    kind: "parafrasis",
  },
  {
    text: "Enseñar no es transferir conocimiento, sino crear las posibilidades para su propia producción o construcción.",
    author: "Paulo Freire",
    kind: "cita",
    source: "Pedagogía de la autonomía",
  },
  {
    text: "La mente no es un recipiente que haya que llenar, sino un fuego que hay que encender.",
    author: "Plutarco",
    kind: "parafrasis",
    source: "Sobre cómo se debe escuchar",
  },
  {
    text: "La educación es un proceso de vida y no una preparación para la vida futura.",
    author: "John Dewey",
    kind: "cita",
    source: "Mi credo pedagógico",
  },
  {
    text: "El objetivo de la educación es la virtud y el deseo de convertirse en un buen ciudadano.",
    author: "Platón",
    kind: "parafrasis",
    source: "Las leyes",
  },
  {
    text: "El conocimiento es poder.",
    author: "Francis Bacon",
    kind: "cita",
    source: "Meditationes Sacrae",
  },
  {
    text: "Aprender sin reflexionar es malgastar la energía.",
    author: "Confucio",
    kind: "cita",
    source: "Analectas",
  },
  {
    text: "La educación es el desarrollo en el hombre de toda la perfección de que su naturaleza es capaz.",
    author: "Immanuel Kant",
    kind: "atribuida",
  },
  {
    text: "El arte supremo del maestro consiste en despertar el goce de la expresión creativa y del conocimiento.",
    author: "Albert Einstein",
    kind: "atribuida",
  },
  {
    text: "Lo que tenemos que aprender a hacer, lo aprendemos haciendo.",
    author: "Aristóteles",
    kind: "cita",
    source: "Ética a Nicómaco",
  },
  {
    text: "La enseñanza que deja huella no es la que se hace de cabeza a cabeza, sino de corazón a corazón.",
    author: "Howard G. Hendricks",
    kind: "atribuida",
  },
];

const LAST_KEY = "docentia:last-quote";

/**
 * Random index that differs from the one shown on the previous visit in this tab.
 * sessionStorage holds only that index (no personal data); if storage is unavailable it still works.
 */
export function pickQuoteIndex(count = EDUCATION_QUOTES.length): number {
  let last = -1;
  try {
    last = Number(sessionStorage.getItem(LAST_KEY) ?? -1);
  } catch {
    // Private mode or blocked storage: fall back to a plain random pick.
  }
  let next = Math.floor(Math.random() * count);
  if (count > 1 && next === last) next = (next + 1 + Math.floor(Math.random() * (count - 1))) % count;
  try {
    sessionStorage.setItem(LAST_KEY, String(next));
  } catch {
    // Ignore: avoiding an immediate repeat is a nicety, not a requirement.
  }
  return next;
}

/** Caption under the quote, worded by how reliable the attribution is. */
export function quoteCaption({ author, kind, source }: EducationQuote): string {
  if (kind === "atribuida") return `Atribuida a ${author}`;
  if (kind === "parafrasis") return `Idea de ${author}${source ? `, ${source}` : ""}`;
  return source ? `${author}, ${source}` : author;
}
