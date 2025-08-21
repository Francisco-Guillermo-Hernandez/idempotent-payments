import {
	StackProps,
	Stack,
	RemovalPolicy,
	Duration,
	CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { TableV2, TableClass, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import {
	ServicePrincipal,
	Role,
	PolicyStatement,
	Effect,
	ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import { Runtime, Code, Function } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
// import { LambdaIntegration, RestApi, HttpIntegration, PassthroughBehavior, } from 'aws-cdk-lib/aws-apigateway';
import { HttpApi, CorsHttpMethod, HttpMethod, HttpStage, LogGroupLogDestination } from 'aws-cdk-lib/aws-apigatewayv2';
import { CfnWebACL, } from 'aws-cdk-lib/aws-wafv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { AccessLogFormat } from 'aws-cdk-lib/aws-apigateway';
import { Distribution, OriginProtocolPolicy, ViewerProtocolPolicy, OriginSslPolicy, AllowedMethods, OriginRequestPolicy, CachePolicy } from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';


const distPath = '../../backend/production/';

export class InfrastructureStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		new TableV2(this, 'providers', {
			partitionKey: {
				name: 'id',
				type: AttributeType.STRING,
			},
			tableClass: TableClass.STANDARD,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: true,
				recoveryPeriodInDays: 30,
			},
			contributorInsights: true,
			removalPolicy: RemovalPolicy.DESTROY, //
			deletionProtection: false, //
			tags: [
				{ key: 'Category', value: 'Electronic payment' },
				{ key: 'Catalogs', value: 'Providers' },
			],
		});

		const billsTable = new TableV2(this, 'bills', {
			partitionKey: {
				name: 'NPE',
				type: AttributeType.STRING,
			},
			tableClass: TableClass.STANDARD,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: true,
				recoveryPeriodInDays: 2,
			},
			contributorInsights: false,
			removalPolicy: RemovalPolicy.DESTROY,
			deletionProtection: false, //
			tags: [{ key: 'Category', value: 'Electronic payment' }],
		});

		const idempotencyTable = new TableV2(this, 'idempotency', {
      		partitionKey: {
        		name: 'id',
        		type: AttributeType.STRING,
      		},
      		timeToLiveAttribute: 'expiration',
			removalPolicy: RemovalPolicy.DESTROY,
			deletionProtection: false, //
			tags: [{ key: 'Category', value: 'Electronic payment' }],
    	});

		/**
		 * @description Policies
		 */

		const createAndUpdateBillsPolicy = new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [billsTable.tableArn,],
			actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:BatchWriteItem'],
		});

		const listBillsPolicy = new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [billsTable.tableArn],
			actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
		});

		const createIdempotencyPolicy = new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [idempotencyTable.tableArn],
			actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem', 'dynamodb:DeleteItem', 'dynamodb:Query'],
		});

		/**
		 * @description Roles
		 */
		const billsTableWriterRole = new Role(this, 'BillsTableWriterRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
			roleName: 'BillsTableWriterRole',
			description: 'Role allowing create/add/update items in billsTable',
		});

		const billsTableReaderRole = new Role(this, 'BillsTableReaderRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
			roleName: 'BillsTableReaderRole',
			description: 'Role allowing list/find items in billsTable',
		});

		const idempotencyTableRole = new Role(this, 'IdempotencyTableRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
			roleName: 'IdempotencyTableRole',
			description: 'Role allowing items GetItem/UpdateItem/GetItem/DeleteItem and Query in idempotencyTable',
		});

		/**
		 * @description Attach policies to roles
		 */

		billsTableWriterRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaBasicExecutionRole'
			)
		);

		billsTableWriterRole.addToPolicy(createAndUpdateBillsPolicy);
		billsTableWriterRole.addToPolicy(createIdempotencyPolicy);

		billsTableReaderRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaBasicExecutionRole'
			)
		);
		billsTableReaderRole.addToPolicy(listBillsPolicy);


		idempotencyTableRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaBasicExecutionRole'
			)
		);
		idempotencyTableRole.addToPolicy(createIdempotencyPolicy);

		const createBillsLambdaFunction = new Function(
			this,
			'create-bills-lambda-function',
			{
				runtime: Runtime.NODEJS_22_X,
				handler: 'main.handler',
				code: Code.fromAsset(
					join(__dirname, distPath, 'create-bills/')
				),
				memorySize: 128,
				timeout: Duration.minutes(1),
				role: billsTableWriterRole,
				environment: {
					ENV: 'production',
					PAYMENTS_TABLE_NAME: billsTable.tableName,
				},
			}
		);

		const showBillsDetailsLambdaFunction = new Function(
			this,
			'show-bill-details-lambda-function',
			{
				runtime: Runtime.NODEJS_22_X,
				handler: 'main.handler',
				code: Code.fromAsset(
					join(__dirname, distPath, 'show-bill-details')
				),
				memorySize: 128,
				timeout: Duration.minutes(1),
				role: billsTableReaderRole,
				environment: {
					ENV: 'production',
					PAYMENTS_TABLE_NAME: billsTable.tableName,
				},
			}
		);

		const payBillsLambdaFunction = new Function(
			this,
			'pay-bills-lambda-function',
			{
				runtime: Runtime.NODEJS_22_X,
				handler: 'main.handler',
				code: Code.fromAsset(join(__dirname, distPath, 'pay-bills')),
				memorySize: 128,
				timeout: Duration.minutes(1),
				role: billsTableWriterRole,
				environment: {
					ENV: 'production',
					PAYMENTS_TABLE_NAME: billsTable.tableName,
					IDEMPOTENCY_TABLE_NAME: idempotencyTable.tableName,
				},
			}
		);

		/**
		 * @description
		 */
		const httpApi = new HttpApi(this, 'bills-api', {
			description: 'HTTP API Gateway for a collection of Lambda functions',
			corsPreflight: {
				allowHeaders: ['*'],
				allowOrigins: ['*'], // Only for development purposes
				allowMethods: [CorsHttpMethod.OPTIONS, CorsHttpMethod.POST, CorsHttpMethod.GET]
			}
		});


		/**
		 * @description
		 */

		httpApi.addRoutes({
			path: '/bills/create',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('createBillsLambdaFunctionLambdaIntegration', createBillsLambdaFunction)
		});

		httpApi.addRoutes({
			path: '/bills/show',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('showBillsDetailsLambdaFunctionLambdaIntegration', showBillsDetailsLambdaFunction)
		});

		httpApi.addRoutes({
			path: '/bills/pay',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('PayBillsLambdaFunctionHttpLambdaIntegration', payBillsLambdaFunction)
		});


		/**
		 * @description
		 *
		 */
		const webACL = new CfnWebACL(this, 'ApiRateLimitWAF', {
			scope: 'CLOUDFRONT',
			defaultAction: { allow: {} },
			visibilityConfig: {
				cloudWatchMetricsEnabled: true,
				metricName: 'ApiRateLimit',
				sampledRequestsEnabled: true,
			},
			rules: [
				{
					name: 'RateLimitRule',
					priority: 1,
					action: { block: {} },
					statement: {
						// means 100 request per IP per 5 minutes
						rateBasedStatement: {
							limit: 100,
							evaluationWindowSec: 5 * 60,
							aggregateKeyType: 'IP',
						},
					},
					visibilityConfig: {
						cloudWatchMetricsEnabled: true,
						metricName: 'RateLimitRule',
						sampledRequestsEnabled: true,
					},
				},
			],
		});

		/**
		 * @description Stage for production environment
		 */
		const productionStage = new HttpStage(this, 'ProductionStage', {
			httpApi,
			stageName: 'production',
			autoDeploy: true,
			accessLogSettings: {
				destination: new LogGroupLogDestination(new LogGroup(this, 'ProductionStageLogGroup')),
				format: AccessLogFormat.clf(),
			},
		});


		/**
		 * @description In order to use WAF with HTTP Gateway is necessary to create a distribution first,
		 * because HttpApi doesn't have support yet
		 */
		new Distribution(this, 'BillsCloudFrontDistribution', {
			defaultBehavior: {
				origin: new HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`, {
					httpsPort: 443,
					protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
					originSslProtocols: [OriginSslPolicy.TLS_V1_2],
					readTimeout: Duration.seconds(30),
					keepaliveTimeout: Duration.seconds(5),
				}),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				allowedMethods: AllowedMethods.ALLOW_ALL,
        		cachePolicy: CachePolicy.CACHING_DISABLED, // Disable caching for API responses
        		originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
			},
			enabled: true,
			comment: `CloudFront distribution for ${httpApi.apiId}`,
			webAclId: webACL.attrArn
		});



		//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2-readme.html

		/**
		 * @description
		 */
		new CfnOutput(this, 'ApiUrl', {
			value: httpApi.apiEndpoint,
		});

		new CfnOutput(this,  'stage', {
			value: productionStage.stageName
		});
	}
}
