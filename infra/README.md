## ツール

環境設定を行うためのツールはmise(もしくはasdf)を使用し準備します。下記を参考にどちらかをインストールしてください。

- [mise](https://mise.jdx.dev/getting-started.html)
- [asdf](https://asdf-vm.com/guide/getting-started.html)

今回はmiseを使用する前提でセットアップ手順を記載します。

1. リポジトリ直下のinfraディレクトリに移動し`mise install`コマンドを実行します。

以上でツールのセットアップは完了です。

## 準備

AWS環境にTerraformを実行するするためのユーザーやバケットを作成します。

1. AWSコンソールのCloudFormationから`cfn/init.yaml`を元にスタックを作成してください。

   スタック名は`cloud-kintai-poc`とします。今後何度か使い回すため環境変数にセットしておきます。

   ```
   export CFn_STACK_NAME='cloud-kintai-poc'
   ```

   AWS CLIを使用できる環境であれば、下記のコマンドを実行してスタックを作成してもOKです。

   ```
   aws cloudformation deploy --template-file ./cfn/init.yaml --stack-name $CFn_STACK_NAME --capabilities CAPABILITY_NAMED_IAM
   ```

   スタックの作成に成功すると、IAMユーザーとTerraformのステートファイルを保存するためのS3、排他ロックのDynamoDBが作成されます。

1. AWSコンソールのSecrets Managerから`iam-user/terraform-<stack-name>-<account-id>`を選択し、クレデンシャル情報をコピーします。

1. AWS CLIからAWSを操作できるようにアカウントをセットアップします。

   ```
   aws configure --profile ${CFn_STACK_NAME}-terraform
   ```

   コマンドを実行すると下記の通りクレデンシャル情報の入力を促されるので、コピーした値を入力してください。

   ```
   AWS Access Key ID [None]:     <- AccessKeyIdの値
   AWS Secret Access Key [None]: <- SecretAccessKeyの値
   Default region name [None]: ap-northeast-1
   Default output format [None]: json
   ```

   確認

   ```
   aws --profile ${CFn_STACK_NAME}-terraform sts get-caller-identity --query Arn
   ```

1. AWSコンソールのSecrets Managerから`iam-user/amplify-<stack-name>-<account-id>`を選択し、クレデンシャル情報をコピーします。

## クラウド勤怠に必要なリソースの作成

クラウド勤怠はリソースのほとんどをAmplifyで作成します。しかし、Amplifyが公式でサポートしていないリソースがいくつかありますので、それらのリソースはTerraformから作成します。

1. Terraformが使うAWS CLIプロファイルを設定します。

   ```
   export AWS_PROFILE=${CFn_STACK_NAME}-terraform
   ```

1. Terraformのバックエンドを設定します。

   ```
   bucket=$(aws cloudformation describe-stacks --stack-name $CFn_STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`Bucket`].OutputValue' --output text)
   key='poc/terraform.tfstate'
   region='ap-northeast-1'
   table=$(aws cloudformation describe-stacks --stack-name $CFn_STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTable`].OutputValue' --output text)
   printf 'bucket = "%s"\nkey = "%s"\nregion = "%s"\ndynamodb_table = "%s"\n' "$bucket" "$key" "$region" "$table" > terraform/envs/poc/s3.tfbackend
   ```

1. 作成するリソースの設定をします。

   ```
   mv terraform/envs/poc/terraform.tfvars{.example,}
   ```

   ```terraform/envs/poc/terraform.tfvars
   # ここで指定できるドメインはRoute53にゾーンが必要です。
   # ゾーンがない場合はコメントアウトしてください。
   domain_identity = "example.com"

   # SESのIDとして登録されます。
   # 不要な場合はコメントアウトしてください。
   email_identity  = "cloud-kintai@example.com"
   ```

1. Terraformを初期化します。

   ```
   terraform -chdir=terraform/envs/poc init -backend-config=s3.tfbackend
   ```

1. 実行計画を確認します。

   ```
   terraform -chdir=terraform/envs/poc plan
   ```

1. リソースを作成します。

   ```
   terraform -chdir=terraform/envs/poc apply
   ```

1. Amplify使用者にクレデンシャル情報を伝えます。

   ```
   eval "$(terraform -chdir=terraform/envs/poc output -raw amplify_get_secret_value)"
   ```
