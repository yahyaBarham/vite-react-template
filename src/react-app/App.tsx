import { useState, useEffect } from "react";
import "./App.css";

type GoldQuote = {
	price: number;
	price_gram_24k: number;
	price_gram_21k: number;
};

function formatJd(amount: number) {
	return `${new Intl.NumberFormat("ar-JO", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount)} د.أ`;
}

const LABELS = {
	title: "أسعار الذهب",
	subtitle: "بالدينار الأردني · تحديث مباشر",
	refresh: "تحديث الأسعار",
	loading: "جاري تحميل الأسعار…",
	error: "تعذّر تحميل الأسعار",
	ounce: "الأونصة",
	ounceHint: "أونصة تروي · عيار 24",
	karat24: "عيار 24",
	karat21: "عيار 21",
	perGram: "للغرام",
} as const;

function App() {
	const [updatePrice, setUpdatePrice] = useState(0);
	const [quote, setQuote] = useState<GoldQuote | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(null);

		const headers = new Headers();
		headers.append("x-access-token", "goldapi-b02873b2b42789adc0331e13e0057c99-io");
		headers.append("Content-Type", "application/json");

		const requestOptions: RequestInit = {
			method: "GET",
			headers,
			redirect: "follow",
			signal: controller.signal,
		};

		fetch("https://www.goldapi.io/api/XAU/JOD", requestOptions)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Request failed (${response.status})`);
				}
				return response.json() as Promise<GoldQuote>;
			})
			.then((data) => setQuote(data))
			.catch((err: unknown) => {
				if (err instanceof DOMException && err.name === "AbortError") {
					return;
				}
				setError(LABELS.error);
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, [updatePrice]);

	const prices = quote
		? [
				{
					key: "ounce",
					karat: null,
					label: LABELS.ounce,
					hint: LABELS.ounceHint,
					value: quote.price,
					featured: true,
				},
				{
					key: "24k",
					karat: "24",
					label: LABELS.perGram,
					hint: LABELS.karat24,
					value: quote.price_gram_24k,
					featured: false,
				},
				{
					key: "21k",
					karat: "21",
					label: LABELS.perGram,
					hint: LABELS.karat21,
					value: quote.price_gram_21k,
					featured: false,
				},
			]
		: [];

	return (
		<div className="gold-app" dir="rtl" lang="ar">
			<div className="gold-app__glow" aria-hidden />

			<header className="gold-header">
				<div className="gold-header__icon" aria-hidden>
					<span>◆</span>
				</div>
				<h1>{LABELS.title}</h1>
				<p>{LABELS.subtitle}</p>
			</header>

			<button
				type="button"
				className="gold-refresh"
				onClick={() => setUpdatePrice((n) => n + 1)}
				disabled={loading}
			>
				<span className={`gold-refresh__icon${loading ? " gold-refresh__icon--spin" : ""}`}>
					↻
				</span>
				{LABELS.refresh}
			</button>

			{loading && (
				<div className="gold-grid gold-grid--loading" aria-busy="true">
					{[1, 2, 3].map((i) => (
						<div key={i} className="gold-card gold-card--skeleton" />
					))}
					<p className="gold-status">{LABELS.loading}</p>
				</div>
			)}

			{error && !loading && <p className="gold-error">{error}</p>}

			{quote && !loading && (
				<div className="gold-grid">
					{prices.map((item) => (
						<article
							key={item.key}
							className={`gold-card${item.featured ? " gold-card--featured" : ""}`}
						>
							{item.karat ? (
								<span className="gold-card__karat">{item.karat}K</span>
							) : (
								<span className="gold-card__karat gold-card__karat--ounce">Au</span>
							)}
							<p className="gold-card__label">{item.label}</p>
							<p className="gold-card__hint">{item.hint}</p>
							<p className="gold-card__price">{formatJd(item.value)}</p>
						</article>
					))}
				</div>
			)}
		</div>
	);
}

export default App;
