# lambdatest
To create a AWS Lambda function you only need to zip up the following files in the lambdatrans dir:
	sudo zip lambdat_trans.zip -r node_modules/ index.js package.json

The myapp dir is an express app that can be run locally to test the lambda function before being uploaded to AWS. It is not needed for the lambda function itself
