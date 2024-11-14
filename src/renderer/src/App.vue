<template>
  <el-container class="layout-container-demo" >
    <el-header class="main-navbar"  >
      <div  class="main-logo">
        <img src="./assets/xtools.png" width="125px">
      </div>
      <div class="main-toolbar">
        <div  class="toolbar">
          <el-text style="margin-right: 10px;font-size: 12px;color: #606266; ">
            Powered by: Darren.X 
            http://www.darren.host
          </el-text>
          
          <el-button type="primary" v-if="!proxyState.state"   @click="toggleProxy" round>启用代理</el-button>
          <el-button type="danger" v-if="proxyState.state"   @click="toggleProxy" round>关闭代理</el-button>
          <el-button type="success" @click="openSetting" :icon="Opportunity" circle />
          <el-button type="warning" @click="openDevTools" :icon="Setting" circle />
          <el-button type="danger"  @click="minimizeWindow" :icon="Close" circle  />
        </div>
      </div>
      
    </el-header>
    <el-container>
      <el-aside width="200px">
      <el-scrollbar max-height="640px">
        <el-menu 
          class="el-menu-vertical-demo"
          default-active="2"
          text-color="#fff"
          background-color="##2b2929"
          :default-openeds="['0','1','2']">

          <el-sub-menu v-for="item in menuItems.data" :key="item.id" :index="item.id" class="el-sub-menu__white">
            <template #title>
              <el-icon><component :is="iconMap[item.icon]"></component></el-icon> 
              {{ item.title }}
            </template>
            <el-menu-item v-for="sub in item.items" :key="sub.id" :index="sub.id" @click="goPage(sub)">{{ sub.title }}</el-menu-item>

           </el-sub-menu>
                
        </el-menu>
      </el-scrollbar>
    </el-aside>
      <el-main >
          <webview v-for="item in iframeItems" :src="item.url" class="main-iframe" :style="item.display" 
              @did-start-loading="onStartLoading(item)"
              @did-finish-load="onFinishLoad(item)"
              >
          </webview>

      </el-main>
    </el-container>
  </el-container>

  <el-dialog
    v-model="viewState.dialogVisible"
    title="提示"
    width="500"
   >
    <span>有新版本是否下载更新</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="viewState.dialogVisible = false">暂不更新</el-button>
        <el-button type="primary" @click="handleDialogClose">
          下载更新
        </el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script lang="ts" setup>


import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Menu as IconMenu,Opportunity,Message,Close,Setting,
Watermelon,
Pear,
NoSmoking,
Smoking,
Mug,
GobletSquareFull,
GobletFull,
KnifeFork,
Sugar,
Bowl,
MilkTea,
Lollipop,
Coffee,
Chicken,
Dish,
IceTea,
ColdDrink,
CoffeeCup,
DishDot,
IceDrink,
IceCream,
Dessert,
IceCreamSquare,
ForkSpoon,
IceCreamRound,
Food,
HotWater,
Grape,
Fries,
Apple,
Burger,
Goblet,
GobletSquare,
Orange,
Cherry,


 } from '@element-plus/icons-vue'

 const iconMap = ref({
    "Message":Message,
    "Setting":Setting,
    "IconMenu":IconMenu,
    "Watermelon":Watermelon,
    "Pear":Pear,
    "NoSmoking":NoSmoking,
    "Smoking":Smoking,
    "Mug":Mug,
    "GobletSquareFull":GobletSquareFull,
    "GobletFull":GobletFull,
    "KnifeFork":KnifeFork,
    "Sugar":Sugar,
    "Bowl":Bowl,
    "MilkTea":MilkTea,
    "Lollipop":Lollipop,
    "Coffee":Coffee,
    "Chicken":Chicken,
    "Dish":Dish,
    "IceTea":IceTea,
    "ColdDrink":ColdDrink,
    "CoffeeCup":CoffeeCup,
    "DishDot":DishDot,
    "IceDrink":IceDrink,
    "IceCream":IceCream,
    "Dessert":Dessert,
    "IceCreamSquare":IceCreamSquare,
    "ForkSpoon":ForkSpoon,
    "IceCreamRound":IceCreamRound,
    "Food":Food,
    "HotWater":HotWater,
    "Grape":Grape,
    "Fries":Fries,
    "Apple":Apple,
    "Burger":Burger,
    "Goblet":Goblet,
    "GobletSquare":GobletSquare,
    "Orange":Orange,
    "Cherry":Cherry,
})

import jsonData from '@renderer/assets/data.json'

const menuItems = ref(jsonData);

const proxyState = ref({
  state:false,
});
const viewState = ref({
  dialogVisible:false,
  downloadFileURL:"",
});

const display_show = "display:inline-flex; width:100%; height:99%";
const display_hide = "display:none";

const iframeItems = ref([
  { id:0.0,
    url:"",
    loading:true,
    display:display_hide
  }
]);

const loading =  ref(true)

const { ipcRenderer } = require('electron');

function minimizeWindow() {
    ipcRenderer.send('window-minimize');
} 

function openDevTools() {
    ipcRenderer.send('devtools-open');
} 

function handleDialogClose () {


  viewState.value.dialogVisible = false;
  window.api.openExternal(viewState.value.downloadFileURL);

}

async function checkVersion(){

  const lv = await window.api.getVersion();
  window.api.fetch('https://file-nas.oss-cn-heyuan.aliyuncs.com/archive/xtools/version.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(data => {
      const rv = data.version;
      viewState.value.downloadFileURL = data.file;
      if(rv>lv){
          viewState.value.dialogVisible = true;
          console.log("要更新："+data.file);
      }else{
          
          console.log("版本一致"+rv+"|"+lv);
      }

    })
    .catch(error => {
      console.error('Fetch error:', error);
    });

}

async function loadRemoteData(frontTip){
  const lv = menuItems.value.version;

  const fs = require('fs').promises;
  const path = require('path');
  const appPath = await window.api.getAppPath();
  const filePath = path.join(appPath, 'data.json'); 
  
  window.api.fetch('https://file-nas.oss-cn-heyuan.aliyuncs.com/archive/xtools/data.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(data => {
      const rv = data.version;
      console.log(lv +"|"+ rv); 
      if(rv>lv){
        ElMessageBox.confirm('云端有新的工具数据包是否更新')
        .then(() => {
          //删除文件刷新右侧工具菜单
          menuItems.value = data;
          fs.unlink(filePath); 
          loadMenu();

        })
      }else if(frontTip){
        ElMessageBox.confirm('本地已经是最新的了');
      }

    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

async function  openSetting(){
   
  ElMessageBox.confirm('获取线上工具包更新?')
        .then(() => {
          loadRemoteData(true);
        });

}

function onStartLoading(i){
  loading.value = true;
  i.loading = true;
}

function onFinishLoad(i){
  loading.value = false;
  i.loading = false;
  i.display = display_show;

}
function toggleProxy(){
  proxyState.value.state = !proxyState.value.state;
}

function goPage(menu){
  

  let foundItem = iframeItems.value.find((item) => item.id === menu.id);
  
  if(foundItem){
    
    foundItem.display =foundItem.display== display_hide?display_show:display_hide;

  }else{
    
    foundItem = {
        id:menu.id,
        url:menu.url,
        loading:true,
        display:display_show
    }
    iframeItems.value.push(foundItem)

  }
  iframeItems.value.forEach(element => {
      if(element!=foundItem){
        element.display = display_hide;
      }
  });
}




async function loadMenu(){
  
  const fs = require('fs');
  const path = require('path');
  const appPath = await window.api.getAppPath();
  const filePath = path.join(appPath, 'data.json'); 

  if (fs.existsSync(filePath)) {
    console.log('文件存在:'+filePath);
  } else {
    console.log('文件不存在:'+filePath);
    fs.writeFile(filePath,JSON.stringify(menuItems.value), (err) => {
      if (err) {
        console.log('写文件出错:', err);
      } else {
        console.log('文件写入成功');
      }
    });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }else{
      menuItems.value = JSON.parse(data);
      //加载欢迎页
      iframeItems.value[0]=
        { id:0.0,
          url:menuItems.value.home,
          loading:true,
          display:display_show
        }
      

      console.log(iframeItems);

    }
  });

}

loadMenu();
checkVersion();

setTimeout(() => {
    loadRemoteData(false);
}, 6000);



</script>

<style scoped>
.layout-container-demo{
  height: 700px;
}
.layout-container-demo .el-header {
  position: relative;
  background-color: rgb(5 27 81);
  color: #ffffff;
}


.layout-container-demo .el-aside {
  color: var(--el-text-color-primary);
  background: rgb(8 11 14);
}
.layout-container-demo .el-menu {
  border-right: none;
}
.layout-container-demo .el-main {
  padding: 0;
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}

.layout-container-demo .main-toolbar{
   
  flex: 0 0 540px;
  text-align: right;
}
.layout-container-demo .main-logo{
  flex: 1; 
  -webkit-app-region: drag;
  -webkit-user-select: none; /* 用于 Chrome 和 Safari */
  -moz-user-select: none;    /* 用于 Firefox（user-select 不需要这个前缀） */
  -ms-user-select: none;     /* 用于 Internet Explorer */
  user-select: none;         /* 标准语法 */
}
.layout-container-demo .main-navbar{
  padding: 15px;
  display: flex;
 
}
.main-iframe {
  width: 100%;
  height: 800px;
  display: block;
}

</style>