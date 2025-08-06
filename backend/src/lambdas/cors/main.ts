export const handler = async () => {
	return {
		statusCode: 200,
		headers: {
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Origin': 'localhost',
			'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
		},
		body: null,
	};
};
