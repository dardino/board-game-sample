export class OkResponse<T> {

  toString () {
    return JSON.stringify({
      ok: true,
      data: this.data,
    });
  }

  constructor (public data: T) {

  }

}
