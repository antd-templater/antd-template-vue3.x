import { KeepAlive } from 'vue'
import { RouterView } from 'vue-router'
import { SIcon, isIconType } from '@antd-templater/antd-template-lib3.x'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import AProLayout, { clearMenuItem, GlobalHeader } from '@ant-design-vue/pro-layout'
import defaultSettings from '@/configure/defaultSettings'
import useAppStore from '@/store/app'

import LayoutSettingDrawer from './components/LayoutSettingDrawer'
import LayoutBreadcrumb from './components/LayoutBreadcrumb'
import LayoutMultiTab from './components/LayoutMultiTab'
import LayoutAvatar from './components/LayoutAvatar'
import LayoutLogo from './components/LayoutLogo'
import '@/layout/BasicLayout.less'

export default defineComponent({
  name: 'BasicLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const appStore = useAppStore()

    const siderWidth = ref(192)
    const headerHeight = ref(48)
    const collapsedWidth = ref(48)

    const splitMenus: Ref<boolean> = ref(true)
    const collapsedButtonRender: Ref<false> = ref(false)

    const menuData = computed(() => {
      const dynamicRoutes = router.getRoutes()
      const menuDataRoutes = dynamicRoutes.find(route => route.path === '/')?.children || []

      const lazyMenuIcon = (routes: any[]): any[] => {
        if (Array.isArray(routes)) {
          return routes.map(route => ({
            id: route.id,
            path: route.path,
            name: route.name,
            meta: {
              icon: isIconType(route.meta?.icon) ? <SIcon type={route.meta.icon}/> : route.meta?.icon || '',
              title: route.meta?.title || ''
            },
            children: lazyMenuIcon(route.children)
          }))
        }
        return []
      }

      return lazyMenuIcon(clearMenuItem(menuDataRoutes))
    })

    const isAllowOpenKey = ref(!appStore.collapsed && !appStore.isTopMenu || appStore.isMobile)
    const selectedKeys = ref(route.matched.map(route => route.path).filter(path => path !== '/'))
    const openKeys = ref(route.matched.map(route => route.path).filter(path => path !== '/' && isAllowOpenKey.value))

    const findKeys = (key: string, routes: any[]) => {
      for (const route of routes) {
        if (route.path === key) {
          return [route.path]
        }

        if (route.children && route.children.length > 0) {
          const keys = findKeys(key, route.children) as string[] | null
          if (keys) return [route.path, ...keys]
        }
      }
      return null
    }

    const headerRender = (props: any, dom: any) => {
      appStore.toggleMobile(props.isMobile)

      if (props.isMobile || appStore.isSideMenu) {
        return (
          <GlobalHeader {...props}>
            <div style='display: flex; flex: 1 1 auto; alignItems: center; height: 50px; lineHeight: 50px;'>
              <h1
                style='fontSize: 24px; margin: 0 0; padding: 0 15px; color: var(--ant-primary-color); cursor: pointer;'
                onClick={ () => { appStore.toggleCollapsed(!appStore.collapsed) }}
              >
                { props.collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/> }
              </h1>
            </div>
          </GlobalHeader>
        )
      }

      return dom
    }

    const rightContentRender = (props: any) => {
      return (
        <LayoutAvatar
          isTopMenu={appStore.isTopMenu}
          isSideMenu={appStore.isSideMenu}
          themeMode={appStore.themeMode}
        />
      )
    }

    const menuHeaderRender = (props: any) => {
      return (
        <LayoutLogo
          full={false}
          title={defaultSettings.domTitle}
          collapsed={appStore.collapsed}
          themeMode={appStore.themeMode}
          isSideMenu={appStore.isSideMenu}
        />
      )
    }

    const menuExtraRender = (props: any) => {
      if (props.layout === 'mix' && props.isMobile) {
        return (
          <LayoutLogo
            collapsed={appStore.collapsed}
            themeMode={appStore.themeMode}
            isSideMenu={appStore.isSideMenu}
          />
        )
      }

      if (props.layout === 'mix' && !props.isMobile) {
        return <div style='width: 100%; height: 5px'/>
      }
    }

    const onCollapse = (props: any) => {
      if (appStore.isMobile) {
        appStore.toggleCollapsed(true)
      }
    }

    const onSelect = (keys: any) => {
      if (keys.length > 0) {
        const key = keys.pop()
        const routes = unref(menuData)
        selectedKeys.value = findKeys(key, routes) || keys
      }
    }

    watchEffect(() => {
      if (!appStore.isMobile && appStore.isMixMenu) appStore.toggleCollapsed(false)
      if (!appStore.isMobile && appStore.isTopMenu) appStore.toggleCollapsed(true)
      if (!appStore.isMobile && appStore.collapsed) openKeys.value = []
    })

    watch(route, () => {
      isAllowOpenKey.value = !appStore.collapsed && !appStore.isTopMenu || appStore.isMobile
      selectedKeys.value = route.matched.map(route => route.path).filter(path => path !== '/')
      openKeys.value = route.matched.map(route => route.path).filter(path => path !== '/' && isAllowOpenKey.value)
    })

    return () => (
      <AProLayout
        theme={appStore.themeMode}
        layout={appStore.layoutMode}
        navTheme={appStore.themeMode}
        fixedHeader={appStore.fixedHeader}
        fixSiderbar={appStore.fixedSidebar}
        contentWidth={appStore.contentWidth}
        primaryColor={appStore.primaryColor}
        headerTheme={appStore.themeMode !== 'realDark' ? appStore.themeMode : 'dark'}
        menuData={menuData.value}
        collapsed={appStore.collapsed}
        siderWidth={siderWidth.value}
        splitMenus={splitMenus.value}
        headerHeight={headerHeight.value}
        collapsedWidth={collapsedWidth.value}
        collapsedButtonRender={collapsedButtonRender.value}

        v-models={[[selectedKeys.value, 'selectedKeys'], [openKeys.value, 'openKeys']]}
        v-slots={{ headerRender, menuHeaderRender, menuExtraRender, rightContentRender }}
        onMenuClick={onCollapse}
        onCollapse={onCollapse}
        onSelect={onSelect}
      >
        <div class='page-router-view-navigate'>
          <LayoutMultiTab
            multiTab={appStore.multiTab}
            isMobile={appStore.isMobile}
            isMixMenu={appStore.isMixMenu}
            hideMixHeaderTab={appStore.hideMixHeaderTab}
          />

          <LayoutBreadcrumb
            multiTab={appStore.multiTab}
            isMobile={appStore.isMobile}
            isMixMenu={appStore.isMixMenu}
            hideMixHeaderTab={appStore.hideMixHeaderTab}
          />
        </div>

        <div
          class='page-router-view-container'
          style={{
            width: appStore.isTopMenu && appStore.isFixed ? '1200px' : '100%',
            height: (appStore.isMixMenu || appStore.fixedHeader) && appStore.fixedHeaderTab ? 'calc(100% - 38px)' : 'auto',
            position: (appStore.isMixMenu || appStore.fixedHeader) && appStore.fixedHeaderTab ? 'absolute' : 'relative',
            overflow: (appStore.isMixMenu || appStore.fixedHeader) && appStore.fixedHeaderTab ? 'auto' : 'visible',
            margin: '0px auto',
            padding: '0px 0px',
            zIndex: 1,
            right: 0,
            left: 0
          }}
        >
          <RouterView v-slots={{ default: (scope: any) => <KeepAlive>{ scope.Component ? <scope.Component/> : null }</KeepAlive> }}/>
        </div>

        <div class='page-router-view-settings'>
          <LayoutSettingDrawer/>
        </div>
      </AProLayout>
    )
  }
})
