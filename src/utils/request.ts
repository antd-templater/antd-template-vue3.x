import { RawAxiosRequestConfig, CreateAxiosDefaults, AxiosInstance } from 'axios'
import { AppApiBase } from '@/configure/presetEnvironment'
import Notification from 'ant-design-vue/es/notification'
import useUserStore from '@/store/user'
import Axios from 'axios'

/**
 * 定义 Axios 类型
 */
type AxiosDefaultConfig<T = any> = CreateAxiosDefaults<T> & Record<string, any>
type AxiosRequestConfig<T = any> = RawAxiosRequestConfig<T> & Record<string, any>
type AxiosAssertResult<R, T> = R extends AxiosResponseResult ? Promise<AxiosResponseResult<T>> : Promise<T>

/**
 * 创建 Axios 实例
 */
const createAxiosInstance = (config: AxiosDefaultConfig) => {
  const axios = Axios.create(config)
  const proxy = createAxiosInterceptor(axios)
  return <T = any, D = any, R = AxiosResponseResult>(config: AxiosRequestConfig<D>) => proxy(config) as AxiosAssertResult<R, T>
}

/**
 * 创建 Axios 拦截器
 */
const createAxiosInterceptor = (axios: AxiosInstance) => {
  axios.interceptors.request.use(
    config => {
      const user = useUserStore()
      const headers = config.headers

      if (user.token && !headers.token && headers.token !== null) {
        headers.token = `Bearer ${user.token}`
      }

      if (headers['x-msw-requester'] === undefined) {
        headers['x-msw-requester'] = 'Axios'
      }

      if (headers.token === null) {
        delete headers.token
      }

      return config
    }
  )
  axios.interceptors.response.use(
    response => {
      const status = response.status
      const config = response.config

      if (status < 200 || status > 300) {
        return Promise.reject(response)
      }

      if (config.responseType === 'blob' || config.responseType === 'stream' || config.responseType === 'arraybuffer') {
        return response
      }

      if (['403', '401', 403, 401].includes(response.data?.code)) {
        return Promise.reject(response)
      }

      return response.data
    }
  )
  axios.interceptors.response.use(
    response => response,
    error => {
      let status = 500 as any
      let message = '' as any
      let messager = true as boolean
      const token = useUserStore().token
      const logout = useUserStore().logout
      const promise = Promise.reject(error)

      try {
        status = error.status || status
        status = error.data?.code || status
        message = error.data?.message || null
        messager = error.config?.messager !== false
      } catch (e) {}

      if (error.toString().indexOf('timeout') > -1) {
        messager && Notification.error({
          duration: 1.5,
          message: '系统消息',
          description: '请求超时'
        })
        return promise
      }

      if (status === 403 || status === '403') {
        messager && Notification.error({
          duration: 1.5,
          message: '系统消息',
          description: message || '暂无权限'
        })

        return promise
      }

      if (status === 401 || status === '401') {
        messager && Notification.error({
          duration: 1.5,
          message: '系统消息',
          description: message || (token ? 'token已过期' : '暂无权限')
        })

        if (token) {
          logout().then(() => { setTimeout(() => window.location.reload(), 800) })
        }

        return promise
      }

      if (messager === true) {
        Notification.error({
          duration: 1.5,
          message: '系统消息',
          description: message ?? '系统异常'
        })
      }

      return promise
    }
  )
  return axios
}

/**
 *  Axios 实例 - request
 */
export const request = createAxiosInstance({
  baseURL: AppApiBase || '/',
  timeout: 30000,
  messager: true
})
