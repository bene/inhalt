import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  NetworkingV1Api,
} from "@kubernetes/client-node";

const kc = new KubeConfig();
kc.loadFromFile("/Users/bene/.kube/config");

export const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);
export const k8sCoreApi = kc.makeApiClient(CoreV1Api);
export const k8sAppApi = kc.makeApiClient(AppsV1Api);
