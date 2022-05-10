export function main(): void {
  let a = new Float32Array(10);
  a = a.fill(0.0);
  console.log(a[11].toString());
}
