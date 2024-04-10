All files in this directory are only for tinkering purposes. They are not for production use.

> # kubectl create secret docker-registry gcp-artifact-registry --docker-server=us-central1-docker.pkg.dev --docker-email=kuber-896@sandbox-bene.iam.gserviceaccount.com --docker-username=_json_key --docker-password="$(cat serviceaccount.json)"

> kubectl apply -f https://raw.githubusercontent.com/nginxinc/kubernetes-ingress/v3.5.0/deploy/crds.yaml

> helm install nginx-ingress oci://ghcr.io/nginxinc/charts/nginx-ingress --version 1.2.0 --set controller.publishService.enabled=true
