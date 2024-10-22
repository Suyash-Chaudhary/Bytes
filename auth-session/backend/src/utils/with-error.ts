export async function withError<T>(
  promise: Promise<T>
): Promise<[Error] | [undefined, T]> {
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((error) => {
      return [error];
    });
}

export async function withTypesErrors<
  T,
  E extends new (...args: any[]) => Error
>(promise: Promise<T>, errors?: E[]): Promise<[undefined, T] | [E]> {
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((err) => {
      if (errors && errors.some((e) => err instanceof e)) return [err];
      else throw err;
    });
}
