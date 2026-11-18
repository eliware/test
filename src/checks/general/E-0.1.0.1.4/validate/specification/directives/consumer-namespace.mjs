export default function getConsumerDirectiveNamespace(packageJson) {
  return packageJson?.eliware?.id;
}
