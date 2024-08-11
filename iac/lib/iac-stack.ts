import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Dynamo DB for Orders
    const table = new dynamodb.Table(this, 'orders', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
    });

    // Lambda Function : Place Order
    const placeOrderFn = new lambda.Function(this,'PlaceOrder',{
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'placeOrder.handler',
      environment:{
        TABLE_NAME: table.tableName,
        AWS_REGION: this.region,
      }
    })

    // Lambda Function: Fetch Order Details
    const fetchOrderFn = new lambda.Function(this, 'FetchOrder', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'fetchOrder.handler',
      environment: {
        TABLE_NAME: table.tableName,
        AWS_REGION: this.region,
      },
    });

    // Lambda Function: Modify Order
    const modifyOrderFn = new lambda.Function(this, 'ModifyOrder', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'modifyOrder.handler',
      environment: {
        TABLE_NAME: table.tableName,
        AWS_REGION: this.region,
      },
    });

    // Lambda Function; Cancel Order
    const cancelOrderFn = new lambda.Function(this, 'CancelOrder', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'cancelOrder.handler',
      environment: {
        TABLE_NAME: table.tableName,
        AWS_REGION: this.region,
      },
    });

    // Grant permission to Lambda Functions to access table in DDB
    table.grantReadWriteData(placeOrderFn);
    table.grantReadWriteData(fetchOrderFn);
    table.grantReadWriteData(modifyOrderFn);
    table.grantReadWriteData(cancelOrderFn);

    // Define API Gateway
    const apigw = new apigateway.RestApi(this, 'OrdersAPI',{
      restApiName: 'OrdersAPI',
      description: 'Handle Orders'
    })

    // Create /orders resource POST method
    const orders = apigw.root.addResource('orders')
    const placeOrderEndPoint = new apigateway.LambdaIntegration(placeOrderFn)
    orders.addMethod('POST',placeOrderEndPoint)

    // Fetch Order details resource GET method
    const order = orders.addResource('{orderID}')
    const fetchOrderEndPoint = new apigateway.LambdaIntegration(fetchOrderFn)
    order.addMethod('GET', fetchOrderEndPoint)

    // Modify existing Order PATCH method
    const modifyOrderEndPoint = new apigateway.LambdaIntegration(modifyOrderFn)
    order.addMethod('PATCH', modifyOrderEndPoint)

    // Cancel existing Order DELETE method
    const cancelOrderEndPoint = new apigateway.LambdaIntegration(cancelOrderFn)
    order.addMethod('DELETE',cancelOrderEndPoint)


  }
}
