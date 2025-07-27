export type Request = {
	npe: string;
};

export type Response = {
	[key: string]: unknown;
};

export type Headers = {
	[key: string]: string;
}

export type SubscriptionResult = {
	id: string;
};
