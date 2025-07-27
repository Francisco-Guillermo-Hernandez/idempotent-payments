import { StackProps, Stack, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { TableV2, TableClass, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import {
	ManagedPolicy,
	PolicyDocument,
	AnyPrincipal,
	ServicePrincipal,
	AccountRootPrincipal,
	Role,
	PolicyStatement,
	Effect,
} from 'aws-cdk-lib/aws-iam';
import { Runtime, Code, Function } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { addCors } from './mock';

export class InfrastructureStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		new TableV2(this, 'providers', {
			tableName: 'providers',
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
			removalPolicy: RemovalPolicy.DESTROY,
			deletionProtection: false, //
			tags: [
				{ key: 'Category', value: 'Electronic payment' },
				{ key: 'Catalogs', value: 'Providers' },
			],
		});

		const billsTable = new TableV2(this, 'bills', {
			tableName: 'bills',
			partitionKey: {
				name: 'npe',
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
			tags: [
				{ key: 'Category', value: 'Electronic payment' },
			],
		});

		/**
		 * @description Policies
		 */

		const createAndUpdateBillsPolicy = new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [billsTable.tableArn],
			// principals: [new AnyPrincipal()],
			actions: [
				'dynamodb:PutItem',
				'dynamodb:UpdateItem',
			],
		});

		const listBillsPolicy = new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [billsTable.tableArn],
			// principals: [new AnyPrincipal()],
			actions: [
				'dynamodb:GetItem',
				'dynamodb:Query',
				'dynamodb:Scan',
			],
		});


		/**
		 * @description Roles
		 */
		const billsTableWriterRole = new Role(this, 'BillsTableWriterRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
			roleName: 'BillsTableWriterRole',
			description: 'Role allowing create/add/update items in billsTable',
			// inlinePolicies: {
			// 	BillsTableWritePolicy: new PolicyDocument({
			// 		statements: [

			// 		],
			// 	}),
			// },
		});

		const billsTableReaderRole = new Role(this, 'BillsTableReaderRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
			roleName: 'BillsTableReaderRole',
			description: 'Role allowing list/find items in billsTable',
		});

		/**
		 * @description Attach policies to roles
		 */

		// billsTableWriterRole.addManagedPolicy(
      	// 	ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaBasicExecutionRole'),
		// 	// ManagedPolicy.fromManagedPolicyArn(this, 'AWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole')
    	// );
		// billsTableWriterRole.addToPolicy(createAndUpdateBillsPolicy);


		// billsTableReaderRole.addManagedPolicy(
		// 	ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaBasicExecutionRole'),
		// 	// ManagedPolicy.fromManagedPolicyArn(this, 'AWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole')
    	// );
		// billsTableReaderRole.addToPolicy(listBillsPolicy);

		//arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
		//arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole
		const createBillsLambdaFunction = new Function(this, 'create-bills-lambda-function', {
			runtime: Runtime.NODEJS_22_X,
			handler: 'main.handler',
			code: Code.fromAsset(join(__dirname, '../../backend/production/create-bills/')),
			memorySize: 128,
			timeout: Duration.minutes(1),
			// role: billsTableWriterRole,
			environment: {
				ENV: 'production',
				PAYMENTS_TABLE_NAME: billsTable.tableName,
			},
		});

		const showBillsDetailsLambdaFunction = new Function(this, 'show-bill-details-lambda-function', {
			runtime: Runtime.NODEJS_22_X,
			handler: 'main.handler',
			code: Code.fromAsset(join(__dirname, '../../backend/production/show-bill-details')),
			memorySize: 128,
			timeout: Duration.minutes(1),
			// role: billsTableReaderRole,
			environment: {
				ENV: 'production',
				PAYMENTS_TABLE_NAME: billsTable.tableName
			},
		});

		const payBillsLambdaFunction = new Function(this, 'pay-bills-lambda-function', {
			runtime: Runtime.NODEJS_22_X,
			handler: 'main.handler',
			code: Code.fromAsset(join(__dirname, '../../backend/production/pay-bills')),
			memorySize: 128,
			timeout: Duration.minutes(1),
			// role: billsTableWriterRole,
			environment: {
				ENV: 'production',
				PAYMENTS_TABLE_NAME: billsTable.tableName
			},
		});


		/**
		 * @description
		 */

		showBillsDetailsLambdaFunction.addToRolePolicy(listBillsPolicy);

		const api = new RestApi(this, 'bills-api', {
			restApiName: 'bills-api',
		});

		/**
		 * @description
		 */
		const bills = api.root.addResource('bill');

		const pay = bills.addResource('pay');
		pay.addMethod('POST', new LambdaIntegration(payBillsLambdaFunction));
		addCors(pay);

		const create = bills.addResource('create');
		create.addMethod('POST', new LambdaIntegration(createBillsLambdaFunction))
		addCors(create);

		const showDetails = bills.addResource('show-details');
		showDetails.addMethod('POST', new LambdaIntegration(showBillsDetailsLambdaFunction))
		addCors(showDetails);

		/**
		 * @description
		 */
		new CfnOutput(this, 'ApiUrl', {
			value: api.url
		});
	}
}
