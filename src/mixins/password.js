export default {
  methods: {
    async encrypt (password) {
      const iterations = 1e6
      const pwUtf8 = new TextEncoder().encode(password)
      const pwKey = await crypto.subtle.importKey('raw', pwUtf8, 'PBKDF2', false, ['deriveBits'])
      const saltUint8 = crypto.getRandomValues(new Uint8Array(16))
      const params = { name: 'PBKDF2', hash: 'SHA-256', salt: saltUint8, iterations: iterations }
      const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, 256)
      const keyArray = Array.from(new Uint8Array(keyBuffer))
      const saltArray = Array.from(new Uint8Array(saltUint8))
      const iterHex = ('000000' + iterations.toString(16)).slice(-6)
      const iterArray = iterHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
      const compositeArray = [].concat(saltArray, iterArray, keyArray)
      const compositeStr = compositeArray.map(byte => String.fromCharCode(byte)).join('')
      return btoa('v01' + compositeStr)
    },
    async verify (password, key) {
      try {
        let compositeStr = atob(key)
        const version = compositeStr.slice(0, 3)
        const saltStr = compositeStr.slice(3, 19)
        const iterStr = compositeStr.slice(19, 22)
        const keyStr = compositeStr.slice(22, 54)
        if (version !== 'v01') throw new Error('Invalid key')
        const salt = new Uint8Array(saltStr.match(/./g).map(ch => ch.charCodeAt(0)))
        const iterHex = iterStr.match(/./g).map(ch => ch.charCodeAt(0).toString(16)).join('')
        const iterations = parseInt(iterHex, 16)
        const pwUtf8 = new TextEncoder().encode(password)
        const pwKey = await crypto.subtle.importKey('raw', pwUtf8, 'PBKDF2', false, ['deriveBits'])

        const params = {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt,
          iterations
        }
        const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, 256)
        const keyArray = Array.from(new Uint8Array(keyBuffer))
        const keyStrNew = keyArray.map(byte => String.fromCharCode(byte)).join('')
        return keyStrNew === keyStr
      } catch (e) {
        console.log(e)
        return false
      }
    }
  }
}
