<template>
  <el-container>
    <!-- 左侧虚拟人区域 -->
    <el-aside class="avatar-container">
      <div class="weather rain" id="wrapper"></div>
      <div class="avatar-controls">
        <!-- 一键连接模式 -->
        <div v-if="!isStepByStepMode" class="connection-mode-controls">
          <el-button @click="oneClickInitSDK()" type="success" size="mini" :disabled="initComplete" class="call-button">
            <i class="el-icon-phone-outline"></i>
          </el-button>
        </div>
        
        <!-- 分步连接模式 -->
        <div v-else class="step-by-step-controls">
          <!-- 当前步骤信息 -->
          <div class="current-step-info">
            <div class="step-title">
              步骤 {{ currentStepIndex + 1 }}/{{ connectionSteps.length }}
            </div>
            <div class="step-name">{{ getCurrentStep().name }}</div>
            <div class="step-description">{{ getCurrentStep().description }}</div>
          </div>
          
          <!-- 步骤控制按钮 -->
          <div class="step-controls">
            <el-button 
              @click="executeCurrentStep()" 
              :type="getCurrentStep().status === 'success' ? 'success' : 'primary'" 
              size="mini" 
              :disabled="getCurrentStep().status === 'running' || initComplete"
              :loading="getCurrentStep().status === 'running'"
              class="next-step-button"
            >
              <i v-if="getCurrentStep().status === 'success'" class="el-icon-check"></i>
              <i v-else-if="getCurrentStep().status === 'error'" class="el-icon-refresh"></i>
              <i v-else class="el-icon-right"></i>
              {{ getStepButtonText() }}
            </el-button>
          </div>
          
          <!-- 步骤进度条 -->
          <div class="step-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgressPercent() + '%' }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- 挂断按钮（两种模式共用） -->
        <el-button @click="resetSDK()" type="danger" size="mini" :disabled="!initComplete" class="hangup-button">
          <i class="el-icon-phone"></i>
        </el-button>
      </div>
    </el-aside>

    <!-- 右侧聊天区域 -->
    <el-main class="chat-container">
      <div class="chat-header">
        <h3>化学助教</h3>
        <div class="control-buttons">
          <el-button @click="SetApiInfodialog = true" type="text" size="mini">
            <i class="el-icon-setting"></i> API设置
          </el-button>
          <el-button @click="SetGlobalParamsdialog = true" type="text" size="mini">
            <i class="el-icon-s-tools"></i> 全局设置
          </el-button>
          <el-button @click="toggleConnectionMode" type="text" size="mini" :disabled="initComplete">
            <i class="el-icon-s-operation"></i> {{ isStepByStepMode ? '一键模式' : '分步模式' }}
          </el-button>
          <el-button @click="diagnoseRecording" type="text" size="mini" v-if="debugMode">
            <i class="el-icon-video-camera"></i> 录音诊断
          </el-button>
          <!-- <el-switch v-model="nlp" active-text="开启语义理解" inactive-text="关闭语义理解"></el-switch> -->
        </div>
      </div>
      
      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="chatMessages">
        <div class="message-list">
          <div class="message system" v-if="chatMessages.length === 0">
          </div>
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index" 
            :class="['message', message.type]"
          >
            <div class="message-time">{{ formatTime(message.time) }}</div>
            <div class="message-content" v-if="message.type !== 'virtual-human'" v-text="message.content"></div>
            <div class="message-content markdown-body" v-else v-html="renderMarkdown(message.content)"></div>
          </div>
          <!-- 显示临时识别的文本 -->
          <div class="message user temp-message" v-if="tempRecognitionText && recorderbutton">
            <div class="message-content">
              <span class="typing-indicator">识别中...</span>
              {{ tempRecognitionText }}
            </div>
          </div>
          <!-- 显示虚拟人"正在输入"状态 -->
          <div class="message virtual-human temp-message" v-if="isVirtualHumanSpeaking && !tempRecognitionText && pendingAIResponse">
            <div class="message-content">
              <span class="typing-indicator">正在回复...</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 聊天输入区域 -->
      <div class="chat-input-area">
        <el-input
          type="textarea"
          placeholder="请输入内容..."
          v-model="textarea"
          maxlength="2000"
          show-word-limit
          class="chat-textarea"
          :autosize="{ minRows: 2, maxRows: 4 }"
        ></el-input>
        
        <!-- 自定义按钮样式 -->
        <div class="custom-input-actions">
          <div 
            class="custom-button primary-button" 
            @click="writeText()" 
            :class="{'disabled-button': !initComplete}"
          >
            <i class="el-icon-s-promotion"></i> 
            <span>发送</span>
          </div>
          
          <div 
            v-if="recorderbutton == false" 
            class="custom-button primary-button" 
            @click="startRecord()" 
            :class="{'disabled-button': !initComplete}"
          >
            <i class="el-icon-microphone"></i> 
            <span>录音</span>
          </div>
          
          <div 
            v-if="recorderbutton == true" 
            class="custom-button danger-button" 
            @click="stopRecord()"
          >
            <i class="el-icon-mic"></i> 
            <span>停止录音</span>
          </div>
          
          <div 
            class="custom-button warning-button" 
            @click="interrupt()" 
            :class="{'disabled-button': !initComplete}"
          >
            <i class="el-icon-close"></i> 
            <span>打断</span>
          </div>
        </div>
      </div>
    </el-main>

    <!--SetApiInfo悬浮框-->
    <el-dialog title="初始化SDK" :visible.sync="SetApiInfodialog">
      <el-form :model="form">
        <span>此处参数均去交互平台-接口服务中获取</span>
        <el-form-item label="Appid" :label-width="formLabelWidth">
          <el-input
            class="widthclass"
            v-model="form.appid"
            autocomplete="off"
          ></el-input>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="ApiKey" :label-width="formLabelWidth">
          <el-input
            class="widthclass"
            v-model="form.apikey"
            autocomplete="off"
          ></el-input>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="ApiSecret" :label-width="formLabelWidth">
          <el-input
            class="widthclass"
            v-model="form.apisecret"
            autocomplete="off"
          ></el-input>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="SceneId" :label-width="formLabelWidth">
          <el-input
            class="widthclass"
            v-model="form.sceneid"
            autocomplete="off"
          ></el-input>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="ServerUrl" :label-width="formLabelWidth">
          <el-input
            class="widthclass"
            v-model="form.serverurl"
            autocomplete="off"
          ></el-input>
          <span>必填</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="SetApiInfodialog = false">取 消</el-button>
        <el-button
          type="primary"
          @click="(SetApiInfodialog = false), SetApiInfo2()"
          >确 定</el-button
        >
      </div>
    </el-dialog>
    <!--SetGlobalParams悬浮框-->
    <el-dialog title="设置全局变量" :visible.sync="SetGlobalParamsdialog">
      <div style="text-align: center"><h3>打断模式全局设置</h3></div>
      <el-form :model="setglobalparamsform" :label-width="formLabelWidth">
        <el-form-item label="视频协议">
          <el-tooltip
            class="item"
            effect="dark"
            content="支持webrtc/xrtc/rtmp(控制台打印视频流地址)"
            placement="right-start"
          >
            <i class="el-icon-question"></i>
          </el-tooltip>
          <el-select
            v-model="setglobalparamsform.stream.protocol"
            placeholder="请选择视频流协议"
          >
            <el-option label="xrtc" value="xrtc"></el-option>
            <el-option label="webrtc" value="webrtc"></el-option>
            <el-option label="rtmp" value="rtmp"></el-option>
          </el-select>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="透明背景">
          <el-tooltip
            class="item"
            effect="dark"
            content="仅支持xrtc协议"
            placement="right-start"
          >
            <i class="el-icon-question"></i>
          </el-tooltip>
          <el-switch v-model="setglobalparamsform.stream.alpha"></el-switch>
        </el-form-item>
        <el-form-item label="全局交互模式">
          <el-radio-group v-model="setglobalparamsform.avatar_dispatch.interactive_mode">
            <el-radio :label="0">追加模式（信息依次播报）</el-radio>
            <el-radio :label="1">打断模式（直接播报最新）</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="形象ID"
        >
          <el-input
            class="widthclass"
            v-model="setglobalparamsform.avatar.avatar_id"
            autocomplete="on"
            placeholder="到交互平台-接口服务-形象列表中获取id"
          ></el-input>
          <span>必填</span>
          </el-form-item>
          <el-form-item
          label="分辨率高"
        >
          <el-input
            class="widthclass"
            v-model="setglobalparamsform.avatar.height"
            autocomplete="on"
          ></el-input>
          </el-form-item>
          <el-form-item
          label="分辨率宽"
        >
          <el-input
            class="widthclass"
            v-model="setglobalparamsform.avatar.width"
            autocomplete="on"
          ></el-input>
        </el-form-item>
        <el-form-item label="音频采样率">
          <el-radio-group v-model="setglobalparamsform.avatar.audio_format">
            <el-radio :label="1">16K(传1)</el-radio>
            <el-radio :label="2">24K(传2，大部分情况默认24K即可)</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="形象裁剪"
          v-if="setglobalparamsform.avatar.mask_region != null"
        >
          <el-input
            class="widthclass"
            v-model="setglobalparamsform.avatar.mask_region"
            autocomplete="on"
            placeholder="对形象进行裁剪[从左到右,从上到下,从右到左,从下到上]"
          ></el-input>
        </el-form-item>
        <el-form-item label="发音人">
          <el-input
            class="widthclass"
            v-model="setglobalparamsform.tts.vcn"
            autocomplete="on"
            placeholder="到交互平台-接口服务-声音列表中获取id"
          ></el-input>
          <span>必填</span>
        </el-form-item>
        <el-form-item label="情感">
          <el-input
            class="widthclass"
            v-model.number="setglobalparamsform.tts.emotion"
            autocomplete="on"
            placeholder="到交互平台-接口服务-声音列表中获取id"
          ></el-input>
        </el-form-item>
        <el-form-item label="是否开启字幕">
          <el-radio-group v-model="setglobalparamsform.subtitle.subtitle">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="0"
              >关闭</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item label="字体颜色">
        <el-color-picker v-model="setglobalparamsform.subtitle.font_color"></el-color-picker>
        </el-form-item>
        <el-form-item label="是否开启背景图">
          <el-radio-group v-model="setglobalparamsform.enable">
            <el-radio :label="true">开启</el-radio>
            <el-radio :label="false"
              >关闭</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item label="背景图片">
          <el-radio-group v-model="setglobalparamsform.background.type">
            <el-radio label="url">URL</el-radio>
            <el-radio label="res_key"
              >res_key(到交互平台-素材管理中获取)</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item label="背景数据">
          <el-input
            v-model="setglobalparamsform.background.data"
            autocomplete="on"
          ></el-input>
        </el-form-item>
      </el-form>

      <el-form :model="form"> </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="SetGlobalParamsdialog = false">取 消</el-button>
        <el-button
          type="primary"
          @click="(SetGlobalParamsdialog = false), SetGlobalParams()"
          >确 定</el-button
        >
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
//模块导入
import AvatarPlatform, {
  PlayerEvents,
  SDKEvents,
} from "../vm-sdk/avatar-sdk-web_3.1.1.1011/index.js";
import { marked } from 'marked'; // 导入Markdown解析器
import hljs from 'highlight.js'; // 导入代码高亮库

// 配置marked解析器
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-', // highlight.js css 需要的前缀
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

//动态虚拟人调节透明度
document.addEventListener("DOMContentLoaded",function(){
    const div = document.getElementById('wrapper');
    const range = document.getElementById('opacityRange');

    range.addEventListener('input', function () {
      div.style.opacity = this.value;
    });
})

let avatarPlatform2 = null;
let recorder = null;
export default {
  name: "avatarComponent",
  data() {
    return {
      SetApiInfodialog: false,
      SetGlobalParamsdialog: false,
      showAdvancedControls: false,
      initComplete: false,
      form: {
        appid: "",//到交互平台-接口服务中获取
        apikey: "",//到交互平台-接口服务中获取
        apisecret: "",//到交互平台-接口服务中获取
        sceneid: "",//到交互平台-接口服务中获取，即"接口服务ID"
        serverurl: "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact",//接口地址，无需更改
      },
      setglobalparamsform: {
        stream: {
          protocol: "xrtc",//（必传）实时视频协议，支持webrtc/xrtc/rtmp，其中只有xrtc支持透明背景，需参数alpha传1
          fps: 25,//（非必传）视频刷新率,值越大，越流畅，取值范围0-25，默认25即可
          bitrate: 1000000,//（非必传）视频码率，值越大，越清晰，对网络要求越高，默认1000000即可
          alpha: true,//（非必传）是否开启透明背景，0关闭1开始，需配合protocol=xrtc使用
        },
        avatar: {
          avatar_id: "138805001",//（必传）授权的形象资源id，请到交互平台-接口服务-形象列表中获取
          width: 1080,//（非必传）视频分辨率宽（不是画布的宽，调整画布大小需调整名为wrapper的div宽）
          height: 1920,//（非必传）视频分辨率高（不是画布的高，调整画布大小需调整名为wrapper的div高）
          mask_region: "[0,0,1080,1920]",//（非必传）形象裁剪参数，[从左到右，从上到下，从右到左，从下到上]
          scale: 1,//（非必传）形象缩放比例，取值范围0.1-1
          move_h: 0,//（非必传）形象左右移动
          move_v: 0,//（非必传）形象上下移动
          audio_format: 1,//（非必传）音频采样率，传1即可
        },
        tts: {
          vcn: "x4_lingxiaoying_assist",//（必传）授权的声音资源id，请到交互平台-接口服务-声音列表中获取
          speed: 50,//（非必传）语速
          pitch: 50,//（非必传）语调
          volume: 100,//（非必传）音量
          emotion:13,//（非必传）情感系数，仅带有情感能力的超拟人音色支持该能力，普通音色不支持
        },
        avatar_dispatch: {
          interactive_mode: 1,//（非必传）0追加模式，1打断模式
        },
        subtitle:{
          subtitle:1,//（非必传）开启字幕，2D形象支持字幕，透明背景不支持字幕，3D形象不支持字幕（3D形象多为卡通形象，2D多为真人形象）
          font_color:"#FFFFFF",//（非必传）字体颜色
          font_name:"Sanji.Suxian.Simple",//（非必传）不支持自定义字体，若不想使用默认提供的
          //字体，那么可以设置asr和nlp监听事件，去获取语音识别和语义理解的文本，自己前端贴字体。
          //支持一下字体：'Sanji.Suxian.Simple','Honglei.Runninghand.Sim','Hunyuan.Gothic.Bold',
          //'Huayuan.Gothic.Regular','mainTitle'
          position_x:100,//（非必传）设置字幕水平位置，必须配置width、height一起使用，否则字幕不显示
          position_y:0,//（非必传）设置字幕竖向位置，必须配置width、height一起使用，否则字幕不显示
          font_size:10,//（非必传）设置字幕字体大小，取值范围：1-10
          width:100,//（非必传）设置字幕宽
          height:100,//（非必传）设置字幕高
        },
        enable:false,//demo中用来控制是否开启背景的参数，与虚拟人参数无关
        background: {
          type: "res_key",//（非必传）上传图片的类型，支持url以及res_key。（res_key请到交互平台-素材管理-背景中上传获取)
          data: "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6dw47gMO+7gGUJfWWfkqD3IxsU/HMK1uJTTxxF2llcKSM4dlSdBy0Piag/DndHocqs32kTOwXUw6lkyggYQBXF0uwTv9jVFm1ZjZgSehV3kpx5RTvizZ9MqEI8lotCRvokC9HLI0pGfKtSmlKgCKL+OUoc9QI5HW3wLtYbLersumd4UCKEPk/uWAdKEh4ntSJiW2km8waGFsg/VSNFj5vaDK3LC4PxfsRvi1a2veZW7JUs/VOleE9wwgTH+A/oqPPcyksBY7aQ4TxYjvS9Qj9LtXkvOwttQMgPGwoxlqBEBhR/xLUwmecHkHzgjACFtxE=",
          //（非必传）图片的值，当type='url'时,data='http://xxx/xxx.png'，当type='res_key'时，data='res_key值'（res_key请到交互平台-素材管理-背景中上传获取)
        }
      },
      formLabelWidth: "120px",
      textarea: "",
      vc: "",
      recorderbutton: false,
      nlp: true, // 默认开启语义理解
      emotion:0,
      action:"A_RH_hello_O",
      volume:100,
      // 聊天相关数据
      chatMessages: [],
      isVirtualHumanSpeaking: false,
      pendingAIResponse: false, // 添加此变量来跟踪AI是否正在准备回复
      // 录音相关状态
      tempRecognitionText: "", // 临时识别的文本
      lastUserMessage: "", // 最后一条用户消息，用于去重
      lastVirtualHumanMessage: "", // 最后一条虚拟人消息，用于去重
      pendingAIResponseContent: null, // 添加此变量来存储AI回复内容
      isConnected: false, // 添加连接状态跟踪变量
      pendingFrames: 0, // 跟踪待播放的语音片段数量
      lastTtsTime: 0, // 记录最后一次收到tts_duration的时间
      debugMode: true, // 调试模式，方便排查问题
      stateCheckTimer: null, // 添加状态检查器
      // 新增录音相关状态
      recordingPermissionGranted: false, // 录音权限状态
      availableAudioDevices: [], // 可用音频设备列表
      currentAudioDevice: null, // 当前使用的音频设备
      recordingErrorCount: 0, // 录音错误计数
      lastRecordingError: null, // 最后一次录音错误
      // 浏览器语音识别相关状态
      speechRecognition: null, // 语音识别实例
      isRecognitionSupported: false, // 浏览器是否支持语音识别
      recognitionLanguage: 'zh-CN', // 识别语言
      speechRecognitionError: null, // 语音识别错误信息
      recognitionTimeout: null, // 识别超时定时器
      isSpeechRecognitionActive: false, // 语音识别是否激活
      // 连接步骤管理
      connectionSteps: [
        { id: 1, name: '检查API配置', method: 'checkApiConfig', status: 'pending', description: '验证API密钥和配置信息' },
        { id: 2, name: '实例化SDK', method: 'initSDK', status: 'pending', description: '创建Avatar SDK实例' },
        { id: 3, name: '创建录音器', method: 'createRecoder', status: 'pending', description: '初始化语音录音功能' },
        { id: 4, name: '设置事件监听', method: 'setAllEvents', status: 'pending', description: '配置SDK和播放器事件' },
        { id: 5, name: '配置API信息', method: 'SetApiInfo2', status: 'pending', description: '设置服务器连接参数' },
        { id: 6, name: '设置全局参数', method: 'SetGlobalParams', status: 'pending', description: '配置虚拟人参数' },
        { id: 7, name: '启动连接', method: 'start', status: 'pending', description: '连接到虚拟人服务' }
      ],
      currentStepIndex: 0, // 当前步骤索引
      isStepByStepMode: false, // 是否为分步模式
    };
  },
  methods: {
    // 添加Markdown渲染方法
    renderMarkdown(text) {
      if (!text) return '';
      try {
        // 先处理文本，增强Markdown体验
        const processedText = this.processResponse(text);
        return marked(processedText);
      } catch (e) {
        console.error('Markdown解析错误', e);
        return text;
      }
    },
    // 处理键盘事件
    handleKeyDown(event) {
      // 当按下A键时触发拨通按钮功能
      if (event.key === 'a' || event.key === 'A') {
        console.log('检测到A键被按下，触发拨通功能');
        this.oneClickInitSDK();
      }
    },
    processResponse(text) {
      if (!text) return '';
      
      // 如果检测到代码块但没有指定语言，默认添加常见编程语言
      const codeBlockRegex = /```\s*\n/g;
      text = text.replace(codeBlockRegex, '```javascript\n');
      
      // 检测数学公式，可以添加特殊处理（这里仅做示例）
      // 实际项目中可能需要引入KaTeX或MathJax来渲染数学公式
      
      // 处理表格，确保表格格式正确
      const tableHeaderRegex = /\|\s*(.+)\s*\|\s*\n\|\s*[-:]+\s*\|/g;
      if (tableHeaderRegex.test(text) && !text.includes('|-------')) {
        text = text.replace(/\|\s*[-:]+\s*\|/g, function(match) {
          return match.replace(/[-:]+/g, function(dash) {
            return '-'.repeat(dash.length);
          });
        });
      }
      
      return text;
    },
    initSDK() {
      //必须先实例化SDK，再去调用其挂载的方法
      avatarPlatform2 = new AvatarPlatform();
      if (avatarPlatform2 != null) {
        this.open2("实例化SDK成功");
      }
    },
    createRecoder() {
      // 使用浏览器原生语音识别替代SDK录音器
      console.log('初始化语音识别功能...');
      
      // 初始化浏览器语音识别
      const speechRecognitionInitialized = this.initSpeechRecognition();
      
      if (speechRecognitionInitialized) {
        this.open2("浏览器语音识别初始化成功");
        
        // 同时尝试初始化SDK录音器（如果需要的话）
        if (avatarPlatform2 != null) {
          try {
            recorder = avatarPlatform2.createRecorder();
            console.log("SDK录音器也已创建（备用）");
          } catch (error) {
            console.warn("SDK录音器创建失败，使用浏览器语音识别:", error);
          }
        }
        
        return true;
      } else {
        // 如果浏览器语音识别不可用，尝试使用SDK录音器
        if (avatarPlatform2 != null) {
          try {
            recorder = avatarPlatform2.createRecorder();
            this.open2("SDK录音器创建成功（语音识别降级方案）");
            return true;
          } catch (error) {
            console.error("SDK录音器也创建失败:", error);
            this.open2("录音功能初始化失败");
            return false;
          }
        } else {
          alert("语音识别不可用，且SDK未实例化");
          return false;
        }
      }
    },
    setSDKEvenet() {
      //绑定SDK事件
      if (avatarPlatform2 != null) {
      const self = this;
      avatarPlatform2
        .on(SDKEvents.connected, function (initResp) {
          console.log("SDKEvent.connect:initResp:", initResp);
          self.addSystemMessage("连接成功");
          
          // 连接成功后更改虚拟人背景颜色
          const avatarContainer = document.querySelector('.avatar-container');
          if (avatarContainer) {
            // 更改背景为渐变蓝色背景
            avatarContainer.style.background = 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)';
          }
          
          self.isConnected = true; // 更新连接状态
        })
        .on(SDKEvents.stream_start, function () {
          console.log("stream_start");
        })
        .on(SDKEvents.disconnected, function (err) {
          console.log("SDKEvent.disconnected:", err);
          self.addSystemMessage("连接已断开");
          if (err) {
            // 因为异常 而导致的断开！ 此处可以进行 提示通知等
            console.error("ws link disconnected because of Error");
            console.error(err.code, err.message, err.name, err.stack);
            self.addSystemMessage("连接异常: " + err.message);
          }
        })
        .on(SDKEvents.nlp, function (nlpData) {
          console.log("语义理解内容nlp全数据:", JSON.stringify(nlpData));
          
          // 根据状态区分处理
          if (nlpData && nlpData.status !== undefined) {
            if (nlpData.status === 0) {
              // status=0 是用户的输入被识别后的内容，但在这个例子中同时也包含了AI的回复
              console.log("NLP识别到用户输入[status=0]:", nlpData.text);
              
              // 这里不需要添加用户消息，因为已经在ASR事件中添加了
              self.pendingAIResponse = true; // 设置为等待AI回复状态
              console.log("用户输入被识别，设置pendingAIResponse=true");
              
              // 检查status=0时是否已经包含AI回复内容
              if (nlpData.content || nlpData.displayContent) {
                console.log("在status=0阶段检测到AI回复:", nlpData.content || nlpData.displayContent);
                
                // 提取回复内容 - 支持Markdown
                let aiResponse = "";
                
                if (nlpData.content) {
                  aiResponse = nlpData.content;
                } else if (nlpData.displayContent) {
                  aiResponse = nlpData.displayContent;
                } else if (nlpData.ttsAnswer && nlpData.ttsAnswer.text) {
                  aiResponse = nlpData.ttsAnswer.text;
                } else if (nlpData.answer && nlpData.answer.text) {
                  aiResponse = nlpData.answer.text;
                }
                
                // 检测是否为测试Markdown的请求，如果是则添加Markdown示例
                if (aiResponse && (aiResponse.includes("测试Markdown") || aiResponse.includes("显示Markdown示例"))) {
                  aiResponse = self.getMarkdownExample();
                }
                
                if (aiResponse) {
                  console.log("status=0阶段保存AI回复内容:", aiResponse);
                  self.pendingAIResponseContent = aiResponse;
                }
              }
            } else if (nlpData.status === 1) {
              // status=1 是AI的回复内容
              console.log("收到AI回复内容[status=1], content=", nlpData.content);
              console.log("AI回复对象所有字段:", Object.keys(nlpData).join(', '));
              if (nlpData.displayContent) console.log("displayContent=", nlpData.displayContent);
              if (nlpData.ttsAnswer) console.log("ttsAnswer=", nlpData.ttsAnswer.text);
              if (nlpData.answer) console.log("answer=", nlpData.answer.text);
              
              // 预先保存回复内容，但不立即显示
              let aiResponse = "";
              
              // 优先使用content作为AI回复
              if (nlpData.content) {
                aiResponse = nlpData.content;
              } else if (nlpData.displayContent) {
                aiResponse = nlpData.displayContent;
              } else if (nlpData.ttsAnswer && nlpData.ttsAnswer.text) {
                aiResponse = nlpData.ttsAnswer.text;
              } else if (nlpData.answer && nlpData.answer.text) {
                aiResponse = nlpData.answer.text;
              } else {
                console.log("未能从NLP中提取有效回复内容");
                self.pendingAIResponse = false; // 重置等待状态
                return;
              }
              
              // 检测是否为测试Markdown的请求，如果是则添加Markdown示例
              if (aiResponse && (aiResponse.includes("测试Markdown") || aiResponse.includes("显示Markdown示例"))) {
                aiResponse = self.getMarkdownExample();
              }
              
              console.log("已保存AI回复内容[pendingAIResponseContent]:", aiResponse);
              console.log("当前状态: pendingFrames=", self.pendingFrames, "isVirtualHumanSpeaking=", self.isVirtualHumanSpeaking);
              
              // 存储AI回复内容，但暂不显示，等待语音播放完成
              self.pendingAIResponseContent = aiResponse;
              
              // 如果没有帧计数（可能是纯文本回复没有语音），则直接显示
              if (self.pendingFrames === 0 && !self.isVirtualHumanSpeaking) {
                console.log("没有语音播放，准备直接显示AI回复");
                setTimeout(() => {
                  if (self.pendingAIResponseContent && !self.isVirtualHumanSpeaking) {
                    console.log("直接显示AI回复（无语音）:", self.pendingAIResponseContent);
                    self.addVirtualHumanMessage(self.pendingAIResponseContent);
                    self.pendingAIResponseContent = null;
                    self.pendingAIResponse = false;
                  } else {
                    console.log("无法直接显示回复: pendingAIResponseContent=", 
                      self.pendingAIResponseContent, 
                      "isVirtualHumanSpeaking=", self.isVirtualHumanSpeaking);
                  }
                }, 500);
              } else {
                console.log("语音播放中，等待播放完成后显示回复");
              }
            } else if (nlpData.status === 2) {
              // status=2 是流程结束，检查是否有回复内容未显示
              console.log("NLP流程结束[status=2], 检查是否有未显示的回复");
              
              // 如果已经有回复内容但还未显示，并且语音已经播放完成，则显示
              if (self.pendingAIResponseContent && self.pendingFrames === 0 && !self.isVirtualHumanSpeaking) {
                console.log("在status=2阶段显示回复:", self.pendingAIResponseContent);
                setTimeout(() => {
                  self.addVirtualHumanMessage(self.pendingAIResponseContent);
                  self.pendingAIResponseContent = null;
                  self.pendingAIResponse = false;
                }, 500);
              } else if (nlpData.content || nlpData.displayContent) {
                // 如果status=2时才有内容，则保存并显示
                let aiResponse = nlpData.content || nlpData.displayContent || 
                               (nlpData.ttsAnswer ? nlpData.ttsAnswer.text : "") || 
                               (nlpData.answer ? nlpData.answer.text : "");
                               
                // 检测是否为测试Markdown的请求，如果是则添加Markdown示例
                if (aiResponse && (aiResponse.includes("测试Markdown") || aiResponse.includes("显示Markdown示例"))) {
                  aiResponse = self.getMarkdownExample();
                }
                
                if (aiResponse) {
                  console.log("在status=2阶段提取回复内容:", aiResponse);
                  self.pendingAIResponseContent = aiResponse;
                  
                  // 等待短暂时间后显示，避免与语音不同步
                  setTimeout(() => {
                    if (self.pendingAIResponseContent) {
                      console.log("status=2阶段显示回复:", self.pendingAIResponseContent);
                      self.addVirtualHumanMessage(self.pendingAIResponseContent);
                      self.pendingAIResponseContent = null;
                      self.pendingAIResponse = false;
                    }
                  }, 500);
                }
              }
            } else {
              // 其他状态，记录日志
              console.log("NLP其他状态内容[status=" + nlpData.status + "]:", JSON.stringify(nlpData));
            }
          } else {
            console.log("NLP数据没有status字段:", JSON.stringify(nlpData));
          }
        })
        .on(SDKEvents.frame_start, function (frame_start) {
          console.log(
            "推流开始（可以看作一段文本开始播报时间点）frame_start:",
            JSON.stringify(frame_start)
          );
          self.isVirtualHumanSpeaking = true;
          console.log("设置isVirtualHumanSpeaking=true");
        })
        .on(SDKEvents.frame_stop, function (frame_stop) {
          console.log(
            "推流结束（可以看作一段文本结束播报时间点）frame_stop:", 
            JSON.stringify(frame_stop)
          );
          
          // 减少待播放片段计数
          if (self.pendingFrames > 0) {
            self.pendingFrames--;
            console.log("减少待播放片段计数，当前pendingFrames=", self.pendingFrames);
          }
          
          // 判断是否为最后一段语音
          const now = Date.now();
          const timeSinceLastTts = now - self.lastTtsTime;
          const isLastSegment = self.pendingFrames === 0 && (timeSinceLastTts > 500);
          
          console.log("语音片段结束检查: pendingFrames=", self.pendingFrames, 
                      "timeSinceLastTts=", timeSinceLastTts,
                      "isLastSegment=", isLastSegment, 
                      "pendingAIResponseContent=", self.pendingAIResponseContent);
          
          // 如果是最后一段语音停止且有待显示的回复内容，直接显示完整回复
          if (isLastSegment && self.pendingAIResponseContent) {
            console.log("检测到最后一段语音结束，准备显示AI回复:", self.pendingAIResponseContent);
            self.addVirtualHumanMessage(self.pendingAIResponseContent);
            self.pendingAIResponseContent = null;
            self.pendingAIResponse = false;
            self.isVirtualHumanSpeaking = false;
            console.log("已显示AI回复并重置状态");
          } else if (self.pendingFrames === 0) {
            // 设置延时检查，以处理连续语音片段之间可能有间隔的情况
            console.log("设置延时检查回复状态");
            setTimeout(() => {
              console.log("延时检查: pendingFrames=", self.pendingFrames, 
                          "pendingAIResponseContent=", self.pendingAIResponseContent,
                          "pendingAIResponse=", self.pendingAIResponse);
              
              // 检查SDK是否已经完成语音但pendingAIResponseContent为null
              if (self.pendingFrames === 0 && !self.pendingAIResponseContent && 
                  self.pendingAIResponse && !self.isVirtualHumanSpeaking) {
                // 尝试获取SDK可能返回的nlp数据但未保存到pendingAIResponseContent的情况
                console.log("语音播放完成但没有回复内容，尝试在控制台查找最新的回复");
                self.addSystemMessage("正在尝试获取回复...");
                
                // 尝试从SDK中获取回复(仅开发环境调试用)
                try {
                  console.log("尝试从SDK获取回复...");
                  avatarPlatform2.writeCmd("get_nlp_response", "force");
                } catch(e) {
                  console.error("尝试获取SDK回复失败", e);
                }
              } else if (self.pendingFrames === 0 && self.pendingAIResponseContent) {
                console.log("延时检查确认最后一段语音结束，显示回复内容:", self.pendingAIResponseContent);
                self.addVirtualHumanMessage(self.pendingAIResponseContent);
                self.pendingAIResponseContent = null;
                self.pendingAIResponse = false;
                self.isVirtualHumanSpeaking = false;
                console.log("延时检查已显示AI回复并重置状态");
              } else {
                console.log("延时检查未满足显示条件");
              }
            }, 1000); // 1秒延时，足够判断是否还有下一段语音
          }
        })
        .on(SDKEvents.error, function (error) {
          console.log("错误信息error:", error);
          self.addSystemMessage("错误: " + error.message);
        })
        .on(SDKEvents.connected, function () {
          console.log("connected");
        })
        .on(SDKEvents.asr, function (asrData) {
          console.log("语音识别数据asr:", asrData);
          
          // 详细记录ASR数据结构
          console.log("ASR详细数据:", 
            "text=", asrData.text, 
            "status=", asrData.status, 
            "type=", asrData.type
          );
          
          // 当接收到语音识别结果时
          if(asrData && asrData.text) {
            // 一般来说，status: 0-开始, 1-继续, 2-结束
            if(asrData.status === 2 || asrData.type === 'final') { // 最终结果
              self.addUserMessage(asrData.text);
              self.tempRecognitionText = ""; // 清除临时识别文本
              
              // 设置一个延时检查，如果ASR完成后，没有收到NLP回调，则主动查询
              setTimeout(() => {
                if(self.pendingAIResponse && !self.pendingAIResponseContent && !self.isVirtualHumanSpeaking) {
                  console.log("ASR结束后10秒未收到NLP回调，尝试主动获取回复");
                  // 这种情况可能是NLP回调丢失，尝试通过发送一个无意义文本触发系统返回结果
                  try {
                    self.addSystemMessage("正在尝试获取回复...");
                    avatarPlatform2.writeCmd("get_response", "force");
                  } catch(e) {
                    console.error("尝试获取回复失败:", e);
                  }
                }
              }, 10000);
            } else {
              // 显示中间识别结果
              self.updateTempRecognition(asrData.text);
            }
          }
        })
        .on(SDKEvents.tts_duration, function (ttsData) {
          console.log("语音合成用时tts详细数据：", JSON.stringify(ttsData));
          
          // 记录最后一次收到tts_duration事件的时间
          self.lastTtsTime = Date.now();
          
          // 计数待播放的语音片段
          self.pendingFrames++;
          console.log("增加待播放片段计数，当前pendingFrames=", self.pendingFrames, 
                     "pendingAIResponseContent=", self.pendingAIResponseContent);
                     
          // 如果已经有AI回复但未显示，检查是否因为未识别到语音片段开始
          if (self.pendingAIResponseContent && !self.isVirtualHumanSpeaking) {
            console.log("检测到有AI回复但未标记为说话状态，强制设置isVirtualHumanSpeaking=true");
            self.isVirtualHumanSpeaking = true;
          }
        })
        .on(SDKEvents.subtitle_info, function (subtitleData) {
          console.log("subtitleData：", subtitleData);
        })
        .on(SDKEvents.action_start, function (action_start) {
          console.log(
            "动作推流开始（可以看作动作开始时间节点）action_start:",
            action_start
          );
        })
        .on(SDKEvents.action_stop, function (action_stop) {
          console.log(
            "动作推流结束（可以看作动作结束时间点）action_stop：",
            action_stop
          );
        });
      this.open2("监听SDK事件成功");
      }else{
        alert("请先实例化SDK")
      }
    },
    setPlayerEvenet() {
      if (avatarPlatform2 != null) {
      //绑定播放器事件
      const player = avatarPlatform2.createPlayer();
      player
        .on(PlayerEvents.play, function () {
          console.log("paly");
        })
        .on(PlayerEvents.playing, function () {
          console.log("playing");
        })
        .on(PlayerEvents.waiting, function () {
          console.log("waiting");
        })
        .on(PlayerEvents.stop, function () {
          console.log("stop");
        })
        .on(PlayerEvents.playNotAllowed, function () {
          console.log(
            "playNotAllowed：触发了游览器限制自动播放策略，播放前必须与游览器产生交互（例如点击页面或者dom组件），触发该事件后调用avatarPlatform2.player.resume()方法来接触限制"
          );
          player.resume();
        });
      this.open2("监听播放器事件成功");
      }else{
        alert("请先实例化SDK")
      }
    },
    SetApiInfo2() {
      if (avatarPlatform2 == null) {
        alert("请先实例化SDK");
      } else {
        console.log("设置setApiInfo");
        const params = {
          appId: this.form.appid,
          apiKey: this.form.apikey,
          apiSecret: this.form.apisecret,
          serverUrl: this.form.serverurl,
          sceneId: this.form.sceneid,
        };
        console.log("初始化SDK信息：", params);
        // 保存到localStorage
        localStorage.setItem('avatarApiInfo', JSON.stringify(this.form));
        //初始化SDK
        avatarPlatform2.setApiInfo(params);
        this.open2("初始化SDK成功, 配置已保存到本地");
      }
    },
    SetGlobalParams() {
      if (avatarPlatform2 != null) {
        let params = Object.assign({}, this.setglobalparamsform);
        console.log("this.setglobalparamsform.stream.alpha",this.setglobalparamsform.stream.alpha)
        if(this.setglobalparamsform.enable == false){
          delete params.background;
          delete params.enable;
        }
        console.log("this.setglobalparamsform",this.setglobalparamsform)
        if(this.setglobalparamsform.stream.alpha == true){
          console.log("设置alpha=1")
          params.stream.alpha = 1
        }else{
          console.log("设置alpha=0")
          params.stream.alpha = 0
        }
        console.log("设置的全局变量为：",params);
        avatarPlatform2.setGlobalParams(params);
        this.open2("设置全局变量成功")
      } else {
        alert("请先实例化SDK");
      }
    },
    start() {
      if(avatarPlatform2!=null){
      avatarPlatform2
        .start({ wrapper: document.querySelector("#wrapper") })
        .catch((e) => {
          console.error(e.code, e.message, e.name, e.stack);
        });
      }else{
        alert("请先实例化SDK")
      }

    },
    writeText() {
      if(avatarPlatform2 != null){
        const text = this.textarea;
        if (text == "") {
          this.$message.warning("请输入内容");
          return;
        }

        // 添加用户消息到聊天列表
        this.addUserMessage(text);
        
        // 处理特殊命令
        if (text.toLowerCase() === "测试markdown" || text.toLowerCase() === "显示markdown示例") {
          // 本地直接显示Markdown示例
          this.pendingAIResponse = true;
          setTimeout(() => {
            this.addVirtualHumanMessage(this.getMarkdownExample());
            this.pendingAIResponse = false;
            // 语音提示（可选）
            if (this.vc == "") {
              avatarPlatform2.writeText("我已显示Markdown示例", {
                nlp: false,
                tts: {
                  volume: 100,
                },
              });
            } else {
              avatarPlatform2.writeText("我已显示Markdown示例", {
                nlp: false,
                tts: {
                  vcn: this.vc,
                  volume: 100,
                  emotion: this.emotion,
                },
              });
            }
          }, 500);
          return;
        }
        
        // 清空输入框
        const inputText = this.textarea;
        this.textarea = "";
        
        // 设置等待AI回复状态
        this.pendingAIResponse = true;
        console.log("已设置等待AI回复状态为true");
        
        if (this.vc == "") {
          avatarPlatform2.writeText(inputText, {
            nlp: this.nlp,//是否开启语义理解
            tts: {
              volume: 100,
            },
          });
        } else {
          avatarPlatform2.writeText(inputText, {
            nlp: this.nlp,//是否开启语义理解
            tts: {
              vcn:this.vc,//变声
              volume: 100,
              emotion:this.emotion,
            },
          });
        }
      } else {
        alert("请先实例化SDK")
      }
    },
    writeCmd(){
      avatarPlatform2.writeCmd("action",this.action);
    },
    interrupt(){
      if(avatarPlatform2 != null){
      avatarPlatform2.interrupt();
      this.addSystemMessage("已打断当前对话");
      }else {
        alert("请先实例化SDK")
      }
    },
    startRecord() {
      if (!this.initComplete) {
        this.$message.warning("请先连接虚拟人");
        return;
      }
      
      // 检查浏览器语音识别支持
      if (!this.isRecognitionSupported) {
        if (!this.initSpeechRecognition()) {
          this.$message.warning("语音识别功能不可用，请使用文字输入");
          return;
        }
      }
      
      // 检查录音权限
      if (!this.recordingPermissionGranted) {
        this.checkRecordingPermission().then(hasPermission => {
          if (hasPermission) {
            this.doStartSpeechRecognition();
          } else {
            this.$message.warning("无法获取录音权限，请检查浏览器设置");
          }
        });
        return;
      }
      
      this.doStartSpeechRecognition();
    },
    
    doStartSpeechRecognition() {
      try {
        // 清除之前可能残留的临时识别文本
        this.tempRecognitionText = "";
        
        // 设置等待AI回复状态
        this.pendingAIResponse = true;
        console.log("已设置语音识别等待AI回复状态为true");
        
        // 启动语音识别
        this.speechRecognition.start();
        
        // 更新UI状态
        this.recorderbutton = true;
        this.isSpeechRecognitionActive = true;
        
        console.log('浏览器语音识别已启动');
        
        // 设置超时保护（30秒后自动停止）
        this.recognitionTimeout = setTimeout(() => {
          if (this.isSpeechRecognitionActive) {
            console.log('语音识别超时，自动停止');
            this.stopRecord();
            this.addSystemMessage("语音识别时间过长，已自动停止");
          }
        }, 30000);
        
      } catch (error) {
        console.error('启动语音识别失败:', error);
        this.handleSpeechRecognitionError(error.message || 'unknown');
      }
    },
    
    stopRecord() {
      try {
        if (this.isSpeechRecognitionActive && this.speechRecognition) {
          console.log('手动停止语音识别');
          this.speechRecognition.stop();
        }
        
        // 清除超时定时器
        if (this.recognitionTimeout) {
          clearTimeout(this.recognitionTimeout);
          this.recognitionTimeout = null;
        }
        
        // 更新UI状态
        this.recorderbutton = false;
        this.isSpeechRecognitionActive = false;
        
        // 如果有临时识别文本，处理为最终结果
        if (this.tempRecognitionText && this.tempRecognitionText.trim()) {
          const finalText = this.tempRecognitionText.trim();
          this.tempRecognitionText = "";
          this.handleFinalRecognitionResult(finalText);
        } else {
          this.tempRecognitionText = "";
        }
        
        console.log('语音识别已停止');
        
      } catch (error) {
        console.error('停止语音识别失败:', error);
        this.recorderbutton = false;
        this.isSpeechRecognitionActive = false;
        this.tempRecognitionText = "";
      }
    },
    
    stop() {
      if(avatarPlatform2 != null){
      avatarPlatform2.stop();
      }else {
        alert("请先实例化SDK")
      }
    },
    destroy() {
      if(avatarPlatform2 != null){
        //销毁SDK示例，内部包含stop协议，重启需重新示例化avatarPlatform实例
        avatarPlatform2.destroy();
        avatarPlatform2 = null;
        this.initComplete = false;
        this.open2("SDK已销毁");
      } else {
        alert("请先实例化SDK");
      }
    },
    open2(text) {
      this.$message({
        message: text,
        type: "success",
      });
    },
    oneClickInitSDK() {
      if (this.initComplete) {
        this.$message.warning('SDK已经初始化，不需要重复操作');
        return;
      }
      
      if (!this.form.appid || !this.form.apikey || !this.form.apisecret || !this.form.sceneid) {
        // 如果API信息未填写完整，打开设置对话框
        this.SetApiInfodialog = true;
        this.$message.warning('请先填写API信息');
        return;
      }
      
      // 如果全局参数未设置，先打开设置对话框
      if (!this.setglobalparamsform.avatar.avatar_id || !this.setglobalparamsform.tts.vcn) {
        this.$confirm('需要设置全局参数才能完成初始化，是否现在设置?', '提示', {
          confirmButtonText: '设置',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.SetGlobalParamsdialog = true;
        }).catch(() => {
          this.$message.info('初始化已取消');
        });
        return;
      }

      this.addSystemMessage("正在接通中...");

      try {
        // 按顺序执行所有初始化步骤
        this.initSDK();
        this.createRecoder();
        this.setSDKEvenet();
        this.setPlayerEvenet();
        this.SetApiInfo2();
        this.SetGlobalParams();
        this.start();
        
        this.initComplete = true;
        this.addSystemMessage("已接通，可以开始对话了");
        this.$message.success('已接通，可以开始对话了');
      } catch (error) {
        console.error('初始化过程出错:', error);
        this.addSystemMessage("初始化失败: " + error.message);
        this.$message.error('初始化失败: ' + error.message);
      }
    },
    resetSDK() {
      if (!this.initComplete) {
        this.$message.warning('SDK尚未初始化');
        return;
      }
      
      this.$confirm('确定要挂断吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 先停止连接
        if (avatarPlatform2) {
          this.stop();
          this.destroy();
        }
        
        // 重置所有状态
        this.resetAllStates();
        
        // 重置分步连接状态
        if (this.isStepByStepMode) {
          this.resetConnectionSteps();
        }
        
        // 恢复原始背景颜色
        const avatarContainer = document.querySelector('.avatar-container');
        if (avatarContainer) {
          avatarContainer.style.background = '#e8f5e9';
        }
        
        this.$message.success('已挂断');
      }).catch(() => {
        this.$message.info('操作已取消');
      });
    },
    
    // 重置所有状态
    resetAllStates() {
      this.initComplete = false;
      this.recorderbutton = false;
      this.tempRecognitionText = "";
      this.isConnected = false;
      this.pendingAIResponse = false;
      this.pendingAIResponseContent = null;
      this.pendingFrames = 0;
      this.isVirtualHumanSpeaking = false;
      this.lastUserMessage = "";
      this.lastVirtualHumanMessage = "";
      
      // 清除可能存在的所有setTimeout
      for (let i = 1; i < 1000; i++) {
        window.clearTimeout(i);
      }
      
      console.log("已重置所有状态变量，并清除所有延时任务");
    },
    // 聊天相关方法
    addUserMessage(content) {
      // 检查去重
      if (content === this.lastUserMessage) {
        console.log("用户消息重复，已忽略:", content);
        return;
      }

      const message = {
        type: 'user',
        content: content,
        time: new Date()
      };
      this.chatMessages.push(message);
      this.lastUserMessage = content;
      this.tempRecognitionText = ""; // 清除临时识别文本
      this.scrollToBottom();
    },
    addVirtualHumanMessage(content) {
      // 检查消息是否为空
      if (!content || content.trim() === '') {
        console.log("虚拟人回复内容为空，已忽略");
        return;
      }
      
      // 检查去重
      if (content === this.lastVirtualHumanMessage) {
        console.log("虚拟人消息重复，已忽略:", content);
        return;
      }

      // 进行一些基本的安全检查，防止XSS攻击
      // 由于我们使用marked库，它已经有一定的安全检查，但额外的检查不会有害
      // 如果内容看起来可疑（包含script标签等），可以在此处理
      let safeContent = content;
      const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+=/gi
      ];
      
      suspiciousPatterns.forEach(pattern => {
        safeContent = safeContent.replace(pattern, '');
      });
      
      const message = {
        type: 'virtual-human',
        content: safeContent,
        time: new Date()
      };
      this.chatMessages.push(message);
      this.lastVirtualHumanMessage = safeContent; // 保存最后一条信息用于去重
      this.scrollToBottom();
    },
    addSystemMessage(content) {
      const message = {
        type: 'system',
        content: content,
        time: new Date()
      };
      this.chatMessages.push(message);
      this.scrollToBottom();
    },
    updateTempRecognition(text) {
      this.tempRecognitionText = text;
      this.scrollToBottom();
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatMessages;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    },
    formatTime(date) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },
    // 强制显示AI回复（用于解决某些情况下回复无法正常显示的问题）
    forceShowAIResponse() {
      console.log("尝试强制显示AI回复，当前状态: pendingAIResponseContent=", this.pendingAIResponseContent);
      
      if (this.pendingAIResponseContent) {
        console.log("强制显示AI回复:", this.pendingAIResponseContent);
        this.addVirtualHumanMessage(this.pendingAIResponseContent);
        this.pendingAIResponseContent = null;
        this.pendingAIResponse = false;
        this.isVirtualHumanSpeaking = false;
        this.pendingFrames = 0;
        return true;
      } else {
        console.log("没有待显示的AI回复内容");
        return false;
      }
    },
    showDebugInfo() {
      // 实现显示调试信息的逻辑
      console.log("显示调试信息");
      const debugInfo = {
        pendingAIResponse: this.pendingAIResponse,
        pendingAIResponseContent: this.pendingAIResponseContent,
        isVirtualHumanSpeaking: this.isVirtualHumanSpeaking,
        pendingFrames: this.pendingFrames,
        lastTtsTime: this.lastTtsTime,
        timeSinceLastTts: Date.now() - this.lastTtsTime,
        recorderbutton: this.recorderbutton,
        isConnected: this.isConnected,
        lastUserMessage: this.lastUserMessage,
        lastVirtualHumanMessage: this.lastVirtualHumanMessage,
        chatMessagesCount: this.chatMessages.length
      };
      
      console.table(debugInfo);
      
      // 显示调试信息弹窗
      let infoText = "当前系统状态:\n";
      for (const [key, value] of Object.entries(debugInfo)) {
        infoText += `${key}: ${value}\n`;
      }
      
      this.$alert(infoText, '调试信息', {
        confirmButtonText: '确定',
        callback: action => {
          this.$message({
            type: 'info',
            message: `调试信息已关闭`
          });
        }
      });
    },
    getMarkdownExample() {
      // 返回Markdown示例内容
      return `# Markdown格式支持演示

## 基本文本格式

**粗体文本** 和 *斜体文本* 以及 ***粗斜体文本***

~~删除线文本~~

## 列表示例

无序列表:
* 项目1
* 项目2
  * 子项目A
  * 子项目B

有序列表:
1. 第一项
2. 第二项
3. 第三项

## 引用和代码示例

> 这是一段引用文本
> 可以有多行

### 行内代码
使用 \`const example = "inline code"\` 可以插入行内代码

### 代码块
\`\`\`javascript
// 这是一个JavaScript代码示例
function sayHello() {
  console.log("Hello, Markdown!");
  return true;
}
\`\`\`

## 表格示例

| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |

## 链接与图片

[链接文本](https://example.com)

## 其他元素

水平分割线:

---

这是分割线之后的内容`;
    },
    // 录音权限和设备管理方法
    async checkRecordingPermission() {
      try {
        console.log('检查录音权限...');
        
        // 检查权限状态
        if (navigator.permissions) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' });
          console.log('当前麦克风权限状态:', micPermission.state);
          
          // 监听权限变化
          micPermission.addEventListener('change', () => {
            console.log('麦克风权限状态变化:', micPermission.state);
            this.recordingPermissionGranted = micPermission.state === 'granted';
            if (micPermission.state === 'denied') {
              this.addSystemMessage('麦克风权限被拒绝，语音功能不可用');
            }
          });
        }
        
        // 尝试获取麦克风访问权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✓ 成功获取麦克风权限');
        this.recordingPermissionGranted = true;
        
        // 获取音频设备列表
        await this.updateAudioDevices();
        
        // 关闭测试流
        stream.getTracks().forEach(track => track.stop());
        
        return true;
      } catch (error) {
        console.error('录音权限检查失败:', error);
        this.recordingPermissionGranted = false;
        this.lastRecordingError = error;
        
        if (error.name === 'NotAllowedError') {
          this.addSystemMessage('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
        } else if (error.name === 'NotFoundError') {
          this.addSystemMessage('未检测到麦克风设备');
        } else {
          this.addSystemMessage('录音权限检查失败: ' + error.message);
        }
        
        return false;
      }
    },
    
    async updateAudioDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableAudioDevices = devices.filter(device => device.kind === 'audioinput');
        
        console.log('可用音频输入设备:', this.availableAudioDevices.length);
        this.availableAudioDevices.forEach((device, index) => {
          console.log(`  ${index + 1}. ${device.label || '未知设备'} (ID: ${device.deviceId.substring(0, 8)}...)`);
        });
        
        // 如果没有当前设备或设备已不可用，选择默认设备
        if (!this.currentAudioDevice || !this.availableAudioDevices.find(d => d.deviceId === this.currentAudioDevice.deviceId)) {
          this.currentAudioDevice = this.availableAudioDevices.find(d => d.deviceId === 'default') || this.availableAudioDevices[0];
          if (this.currentAudioDevice) {
            console.log('使用音频设备:', this.currentAudioDevice.label || '默认设备');
          }
        }
        
      } catch (error) {
        console.error('获取音频设备列表失败:', error);
      }
    },
    
    setupDeviceChangeListener() {
      if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', async () => {
          console.log('🔄 检测到音频设备变化');
          await this.updateAudioDevices();
          
          // 如果正在录音，给出提示
          if (this.recorderbutton) {
            this.addSystemMessage('检测到音频设备变化，建议重新开始录音');
          }
          
          // 检查当前设备是否仍然可用
          if (this.currentAudioDevice && !this.availableAudioDevices.find(d => d.deviceId === this.currentAudioDevice.deviceId)) {
            this.addSystemMessage('当前音频设备已断开，已切换到默认设备');
            this.handleRecordingError(new Error('音频设备断开'));
          }
        });
        console.log('✓ 已开启音频设备变化监听');
      }
    },
    
    handleRecordingError(error) {
      console.error('录音错误:', error);
      this.recordingErrorCount++;
      this.lastRecordingError = error;
      
      // 如果正在录音，停止录音
      if (this.recorderbutton) {
        this.recorderbutton = false;
        this.tempRecognitionText = "";
      }
      
      // 根据错误类型给出不同的处理建议
      if (error.name === 'NotAllowedError') {
        this.addSystemMessage('录音权限被拒绝，请重新授权');
      } else if (error.name === 'NotFoundError') {
        this.addSystemMessage('音频设备未找到，请检查麦克风连接');
      } else if (error.message.includes('设备断开') || error.message.includes('device')) {
        this.addSystemMessage('音频设备断开，请重新连接并重试');
      } else {
        this.addSystemMessage('录音出现问题，请重试。错误: ' + error.message);
      }
      
      // 尝试自动修复（最多3次）
      if (this.recordingErrorCount <= 3) {
        console.log('尝试自动修复录音器 (第' + this.recordingErrorCount + '次)');
        setTimeout(async () => {
          await this.autoFixRecorder();
        }, 2000);
      } else {
        this.addSystemMessage('录音功能频繁出错，请手动重新初始化SDK');
      }
    },
    
    async autoFixRecorder() {
      try {
        console.log('开始自动修复录音器...');
        
        // 1. 重新检查权限
        const hasPermission = await this.checkRecordingPermission();
        if (!hasPermission) {
          return false;
        }
        
        // 2. 重新创建录音器
        if (avatarPlatform2) {
          recorder = avatarPlatform2.createRecorder();
          console.log('✓ 录音器已自动重新创建');
          this.addSystemMessage('录音功能已自动修复');
          this.recordingErrorCount = 0; // 重置错误计数
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('自动修复失败:', error);
        return false;
      }
    },
    
    // 录音诊断方法
    diagnoseRecording() {
      console.log('=== 录音系统诊断 ===');
      console.log('录音权限状态:', this.recordingPermissionGranted);
      console.log('可用音频设备数量:', this.availableAudioDevices.length);
      console.log('当前音频设备:', this.currentAudioDevice ? this.currentAudioDevice.label : '未设置');
      console.log('录音错误计数:', this.recordingErrorCount);
      console.log('最后一次错误:', this.lastRecordingError);
      console.log('SDK录音器状态:', avatarPlatform2 && avatarPlatform2.recorder ? '已创建' : '未创建');
      console.log('当前录音状态:', this.recorderbutton);
      console.log('=== 语音识别诊断 ===');
      console.log('浏览器语音识别支持:', this.isRecognitionSupported);
      console.log('语音识别实例状态:', this.speechRecognition ? '已创建' : '未创建');
      console.log('语音识别激活状态:', this.isSpeechRecognitionActive);
      console.log('识别语言设置:', this.recognitionLanguage);
      console.log('语音识别错误:', this.speechRecognitionError);
      
      // 显示诊断结果给用户
      const diagnosticInfo = [
        `录音权限: ${this.recordingPermissionGranted ? '✓' : '✗'}`,
        `音频设备: ${this.availableAudioDevices.length} 个可用`,
        `SDK录音器: ${avatarPlatform2 && avatarPlatform2.recorder ? '✓' : '✗'}`,
        `浏览器语音识别: ${this.isRecognitionSupported ? '✓' : '✗'}`,
        `语音识别实例: ${this.speechRecognition ? '✓' : '✗'}`,
        `识别语言: ${this.recognitionLanguage}`,
        `错误次数: ${this.recordingErrorCount}`
      ].join('\n');
      
      this.$alert(diagnosticInfo, '录音系统诊断', {
        confirmButtonText: '确定',
        type: 'info'
      });
    },
    switchToStepMode() {
      this.isStepByStepMode = true;
      this.resetConnectionSteps();
      this.addSystemMessage("已切换到分步连接模式");
    },
    switchToOneClickMode() {
      this.isStepByStepMode = false;
      this.addSystemMessage("已切换到一键连接模式");
    },
    resetConnectionSteps() {
      this.currentStepIndex = 0;
      this.connectionSteps.forEach(step => {
        step.status = 'pending';
      });
    },
    getCurrentStep() {
      return this.connectionSteps[this.currentStepIndex] || {};
    },
    getStepButtonText() {
      const step = this.getCurrentStep();
      switch (step.status) {
        case 'pending':
          return '开始';
        case 'running':
          return '进行中...';
        case 'success':
          return this.currentStepIndex < this.connectionSteps.length - 1 ? '下一步' : '完成';
        case 'error':
          return '重试';
        default:
          return '开始';
      }
    },
    async executeCurrentStep() {
      const step = this.getCurrentStep();
      
      if (step.status === 'success' && this.currentStepIndex < this.connectionSteps.length - 1) {
        // 进入下一步
        this.currentStepIndex++;
        this.addSystemMessage(`开始步骤 ${this.currentStepIndex + 1}: ${this.getCurrentStep().name}`);
        return;
      }
      
      if (step.status === 'success' && this.currentStepIndex === this.connectionSteps.length - 1) {
        // 所有步骤完成
        this.initComplete = true;
        this.addSystemMessage("所有连接步骤已完成！");
        return;
      }
      
      if (step.status === 'running') {
        return;
      }
      
      // 执行当前步骤
      step.status = 'running';
      this.addSystemMessage(`正在执行: ${step.name}`);
      
      try {
        const success = await this.executeStepMethod(step.method);
        if (success) {
          step.status = 'success';
          this.addSystemMessage(`✓ ${step.name} 执行成功`);
          
          // 如果是最后一步，标记初始化完成
          if (this.currentStepIndex === this.connectionSteps.length - 1) {
            this.initComplete = true;
            this.addSystemMessage("🎉 所有步骤完成，连接成功！");
          }
        } else {
          step.status = 'error';
          this.addSystemMessage(`✗ ${step.name} 执行失败`);
        }
      } catch (error) {
        step.status = 'error';
        this.addSystemMessage(`✗ ${step.name} 执行失败: ${error.message}`);
        console.error(`步骤 ${step.name} 执行失败:`, error);
      }
    },
    async executeStepMethod(methodName) {
      try {
        switch (methodName) {
          case 'checkApiConfig':
            return this.checkApiConfig();
          case 'initSDK':
            return this.executeInitSDK();
          case 'createRecoder':
            return this.executeCreateRecorder();
          case 'setAllEvents':
            return this.executeSetAllEvents();
          case 'SetApiInfo2':
            return this.executeSetApiInfo();
          case 'SetGlobalParams':
            return this.executeSetGlobalParams();
          case 'start':
            return this.executeStart();
          default:
            console.error('未知的步骤方法:', methodName);
            return false;
        }
      } catch (error) {
        console.error(`执行步骤方法 ${methodName} 失败:`, error);
        throw error;
      }
    },
    checkApiConfig() {
      console.log('检查API配置...');
      
      if (!this.form.appid || !this.form.apikey || !this.form.apisecret || !this.form.sceneid) {
        this.$message.error('API配置信息不完整，请先填写完整的API信息');
        this.SetApiInfodialog = true;
        return false;
      }
      
      if (!this.setglobalparamsform.avatar.avatar_id || !this.setglobalparamsform.tts.vcn) {
        this.$message.error('全局参数配置不完整，请先配置虚拟人参数');
        this.SetGlobalParamsdialog = true;
        return false;
      }
      
      console.log('✓ API配置检查通过');
      return true;
    },
    executeInitSDK() {
      console.log('正在实例化SDK...');
      try {
        this.initSDK();
        if (avatarPlatform2 != null) {
          console.log('✓ SDK实例化成功');
          return true;
        } else {
          console.error('✗ SDK实例化失败');
          return false;
        }
      } catch (error) {
        console.error('SDK实例化过程出错:', error);
        return false;
      }
    },
    executeCreateRecorder() {
      console.log('正在创建录音器...');
      try {
        const success = this.createRecoder();
        if (success) {
          console.log('✓ 录音器创建成功');
          return true;
        } else {
          console.error('✗ 录音器创建失败');
          return false;
        }
      } catch (error) {
        console.error('录音器创建过程出错:', error);
        return false;
      }
    },
    executeSetAllEvents() {
      console.log('正在设置事件监听器...');
      try {
        this.setSDKEvenet();
        this.setPlayerEvenet();
        console.log('✓ 事件监听器设置成功');
        return true;
      } catch (error) {
        console.error('事件监听器设置失败:', error);
        return false;
      }
    },
    executeSetApiInfo() {
      console.log('正在配置API信息...');
      try {
        this.SetApiInfo2();
        console.log('✓ API信息配置成功');
        return true;
      } catch (error) {
        console.error('API信息配置失败:', error);
        return false;
      }
    },
    executeSetGlobalParams() {
      console.log('正在设置全局参数...');
      try {
        this.SetGlobalParams();
        console.log('✓ 全局参数设置成功');
        return true;
      } catch (error) {
        console.error('全局参数设置失败:', error);
        return false;
      }
    },
    async executeStart() {
      console.log('正在启动连接...');
      try {
        this.start();
        
        // 等待连接建立（最多等待10秒）
        return new Promise((resolve) => {
          let checkCount = 0;
          const maxChecks = 20; // 10秒，每500ms检查一次
          
          const checkConnection = () => {
            checkCount++;
            if (this.isConnected) {
              console.log('✓ 连接建立成功');
              resolve(true);
            } else if (checkCount >= maxChecks) {
              console.log('✗ 连接超时');
              resolve(false);
            } else {
              setTimeout(checkConnection, 500);
            }
          };
          
          checkConnection();
        });
      } catch (error) {
        console.error('启动连接失败:', error);
        return false;
      }
    },
    getProgressPercent() {
      let completedSteps = 0;
      for (let i = 0; i <= this.currentStepIndex; i++) {
        if (this.connectionSteps[i] && this.connectionSteps[i].status === 'success') {
          completedSteps++;
        }
      }
      return (completedSteps / this.connectionSteps.length) * 100;
    },
    toggleConnectionMode() {
      this.isStepByStepMode = !this.isStepByStepMode;
      this.addSystemMessage(`已切换到${this.isStepByStepMode ? '分步' : '一键'}连接模式`);
      if (this.isStepByStepMode) {
        this.resetConnectionSteps();
      }
    },
    // 初始化浏览器语音识别
    initSpeechRecognition() {
      console.log('初始化浏览器语音识别...');
      
      // 检查浏览器是否支持语音识别
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('当前浏览器不支持语音识别功能');
        this.isRecognitionSupported = false;
        this.addSystemMessage('当前浏览器不支持语音识别功能，建议使用Chrome浏览器');
        return false;
      }
      
      try {
        // 创建语音识别实例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        
        // 配置语音识别参数
        this.speechRecognition.continuous = true; // 持续识别
        this.speechRecognition.interimResults = true; // 显示中间结果
        this.speechRecognition.lang = this.recognitionLanguage; // 设置识别语言
        this.speechRecognition.maxAlternatives = 1; // 最大候选数量
        
        // 绑定事件监听器
        this.setupSpeechRecognitionEvents();
        
        this.isRecognitionSupported = true;
        console.log('✓ 浏览器语音识别初始化成功');
        return true;
        
      } catch (error) {
        console.error('语音识别初始化失败:', error);
        this.isRecognitionSupported = false;
        this.speechRecognitionError = error;
        this.addSystemMessage('语音识别初始化失败: ' + error.message);
        return false;
      }
    },
    
    // 设置语音识别事件监听器
    setupSpeechRecognitionEvents() {
      if (!this.speechRecognition) return;
      
      const self = this;
      
      // 识别开始
      this.speechRecognition.onstart = function() {
        console.log('语音识别开始');
        self.isSpeechRecognitionActive = true;
        self.addSystemMessage('开始语音识别...');
      };
      
      // 识别结果
      this.speechRecognition.onresult = function(event) {
        console.log('收到语音识别结果:', event);
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 处理识别结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            console.log('最终识别结果:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('中间识别结果:', transcript);
          }
        }
        
        // 更新UI显示
        if (interimTranscript) {
          self.updateTempRecognition(interimTranscript);
        }
        
        // 处理最终结果
        if (finalTranscript) {
          self.handleFinalRecognitionResult(finalTranscript.trim());
        }
      };
      
      // 识别错误
      this.speechRecognition.onerror = function(event) {
        console.error('语音识别错误:', event.error);
        self.handleSpeechRecognitionError(event.error);
      };
      
      // 识别结束
      this.speechRecognition.onend = function() {
        console.log('语音识别结束');
        self.isSpeechRecognitionActive = false;
        self.recorderbutton = false;
        self.tempRecognitionText = '';
        
        // 清除超时定时器
        if (self.recognitionTimeout) {
          clearTimeout(self.recognitionTimeout);
          self.recognitionTimeout = null;
        }
        
        self.addSystemMessage('语音识别已停止');
      };
      
      // 无语音输入
      this.speechRecognition.onnomatch = function() {
        console.log('无法识别语音内容');
        self.addSystemMessage('无法识别语音内容，请重试');
      };
      
      // 语音检测开始
      this.speechRecognition.onspeechstart = function() {
        console.log('检测到语音输入');
      };
      
      // 语音检测结束
      this.speechRecognition.onspeechend = function() {
        console.log('语音输入结束');
      };
    },
    
    // 处理最终识别结果
    handleFinalRecognitionResult(text) {
      if (!text || text.trim() === '') {
        console.log('识别结果为空，忽略');
        return;
      }
      
      console.log('处理最终识别结果:', text);
      
      // 添加用户消息到聊天列表
      this.addUserMessage(text);
      
      // 清除临时识别文本
      this.tempRecognitionText = '';
      
      // 设置等待AI回复状态
      this.pendingAIResponse = true;
      console.log('已设置等待AI回复状态为true');
      
      // 发送到AI处理
      this.sendTextToAI(text);
    },
    
    // 发送文本到AI处理
    sendTextToAI(text) {
      try {
        if (!avatarPlatform2) {
          this.addSystemMessage('SDK未初始化，无法发送消息');
          this.pendingAIResponse = false;
          return;
        }
        
        // 处理特殊命令
        if (text.toLowerCase() === "测试markdown" || text.toLowerCase() === "显示markdown示例") {
          this.pendingAIResponse = true;
          setTimeout(() => {
            this.addVirtualHumanMessage(this.getMarkdownExample());
            this.pendingAIResponse = false;
            // 语音提示（可选）
            if (this.vc == "") {
              avatarPlatform2.writeText("我已显示Markdown示例", {
                nlp: false,
                tts: {
                  volume: 100,
                },
              });
            } else {
              avatarPlatform2.writeText("我已显示Markdown示例", {
                nlp: false,
                tts: {
                  vcn: this.vc,
                  volume: 100,
                  emotion: this.emotion,
                },
              });
            }
          }, 500);
          return;
        }
        
        // 发送到SDK处理
        if (this.vc == "") {
          avatarPlatform2.writeText(text, {
            nlp: this.nlp,//是否开启语义理解
            tts: {
              volume: 100,
            },
          });
        } else {
          avatarPlatform2.writeText(text, {
            nlp: this.nlp,//是否开启语义理解
            tts: {
              vcn: this.vc,//变声
              volume: 100,
              emotion: this.emotion,
            },
          });
        }
        
        console.log('文本已发送到AI处理:', text);
        
      } catch (error) {
        console.error('发送文本到AI失败:', error);
        this.addSystemMessage('发送消息失败: ' + error.message);
        this.pendingAIResponse = false;
      }
    },
    
    // 处理语音识别错误
    handleSpeechRecognitionError(error) {
      console.error('语音识别错误:', error);
      this.speechRecognitionError = error;
      
      let errorMessage = '';
      switch (error) {
        case 'no-speech':
          errorMessage = '未检测到语音输入';
          break;
        case 'audio-capture':
          errorMessage = '音频捕获失败，请检查麦克风';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝';
          break;
        case 'network':
          errorMessage = '网络错误，语音识别失败';
          break;
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用';
          break;
        default:
          errorMessage = '语音识别错误: ' + error;
      }
      
      this.addSystemMessage(errorMessage);
      
      // 重置状态
      this.recorderbutton = false;
      this.tempRecognitionText = '';
      this.isSpeechRecognitionActive = false;
      
      // 如果是权限问题，尝试重新获取权限
      if (error === 'not-allowed') {
        this.recordingPermissionGranted = false;
        setTimeout(() => {
          this.addSystemMessage('请在浏览器设置中允许麦克风访问，然后重试');
        }, 1000);
      }
    },
  },
  created() {
    // 从localStorage加载数据
    const savedApiInfo = localStorage.getItem('avatarApiInfo');
    if (savedApiInfo) {
      try {
        this.form = JSON.parse(savedApiInfo);
        console.log("从本地存储加载API配置信息");
      } catch (e) {
        console.error("解析本地存储的API配置信息失败", e);
      }
    }
    
    // 初始化调试日志
    console.log("=== 系统初始化 ===");
    console.log("pendingAIResponseContent初始值:", this.pendingAIResponseContent);
    console.log("lastVirtualHumanMessage初始值:", this.lastVirtualHumanMessage);
    console.log("lastUserMessage初始值:", this.lastUserMessage);
    console.log("pendingFrames初始值:", this.pendingFrames);
    console.log("isVirtualHumanSpeaking初始值:", this.isVirtualHumanSpeaking);
    console.log("pendingAIResponse初始值:", this.pendingAIResponse);
    
    // 初始化录音相关功能
    this.initRecordingFeatures();
    
    // 添加状态检查器，每5秒检查一次是否有未显示的回复
    this.stateCheckTimer = setInterval(() => {
      if (this.pendingAIResponseContent && !this.isVirtualHumanSpeaking && 
          Date.now() - this.lastTtsTime > 5000 && this.pendingFrames === 0) {
        console.log("定时检查发现有未显示的AI回复，超过5秒未播放，准备强制显示");
        this.forceShowAIResponse();
      }
    }, 5000);
    
    // 添加键盘事件监听，使A键能触发拨通按钮
    window.addEventListener('keydown', this.handleKeyDown);
  },
  
  // 新增录音功能初始化方法
  async initRecordingFeatures() {
    console.log('初始化录音功能...');
    
    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('当前浏览器不支持录音功能');
      this.addSystemMessage('当前浏览器不支持录音功能');
      return;
    }
    
    // 检查语音识别支持
    if (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) {
      console.log('检测到浏览器支持语音识别');
      // 预先初始化语音识别（不显示错误消息）
      try {
        this.initSpeechRecognition();
      } catch (error) {
        console.log('语音识别预初始化失败:', error.message);
      }
    } else {
      console.warn('当前浏览器不支持Web Speech API');
      this.addSystemMessage('当前浏览器不支持语音识别，建议使用Chrome浏览器');
    }
    
    try {
      // 检查录音权限（静默检查，不弹出权限请求）
      await this.updateAudioDevices();
      
      // 设置设备变化监听
      this.setupDeviceChangeListener();
      
      console.log('录音功能初始化完成');
    } catch (error) {
      console.log('录音功能初始化遇到问题:', error.message);
      // 不显示错误消息，因为用户可能还没有使用录音功能
    }
  },
  beforeDestroy(){
    //关闭页面时调用stop协议，确保链接断开，释放资源
    if(avatarPlatform2){
      avatarPlatform2.stop();
    }
    
    // 清理语音识别资源
    if (this.speechRecognition && this.isSpeechRecognitionActive) {
      try {
        console.log('清理语音识别资源...');
        this.speechRecognition.stop();
        this.speechRecognition = null;
      } catch (error) {
        console.error('清理语音识别资源失败:', error);
      }
    }
    
    // 清除识别超时定时器
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
    
    // 清除定时器
    if (this.stateCheckTimer) {
      clearInterval(this.stateCheckTimer);
    }
    
    // 移除键盘事件监听
    window.removeEventListener('keydown', this.handleKeyDown);
  }
};
</script>

<style scoped>
* {
  margin: 0px;
  padding: 0px;
  box-sizing: border-box;
  border: none;
}
/* 覆盖Element UI的默认样式 */
.el-aside.avatar-container {
  width: 28% !important;
}
.el-main.chat-container {
  width: 72% !important;
}
.el-container {
  height: 100vh;
  width: 100%;
  display: flex;
  padding: 15px;
  box-sizing: border-box;
}
.avatar-container {
  flex: none;
  position: relative;
  height: 100%;
  padding: 0;
  background-color: #e8f5e9;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.avatar-controls {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}
.chat-container {
  height: 100% !important;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 0;
  border-radius: 12px;
  margin-left: 15px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.chat-header {
  padding: 20px 24px;
  background-color: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}
.chat-header h3 {
  margin: 0;
  color: #409EFF;
  font-size: 28px;
}
.control-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #f5f7fa;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.message {
  max-width: 80%;
  padding: 16px 24px;
  border-radius: 14px;
  position: relative;
  animation: fadeIn 0.3s ease;
  transition: all 0.2s ease;
}
.message-time {
  font-size: 18px;
  color: #909399;
  margin-bottom: 6px;
}
.message-content {
  word-break: break-word;
  line-height: 1.6;
  font-size: 21px;
}
.message.user {
  align-self: flex-end;
  background-color: #409EFF;
  color: white;
  border-radius: 24px 24px 0 24px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}
.message.virtual-human {
  align-self: flex-start;
  background-color: white;
  color: #333;
  border-radius: 24px 24px 24px 0;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}
.message.system {
  align-self: center;
  background-color: #f0f0f0;
  color: #606266;
  font-size: 18px;
  padding: 10px 18px;
  border-radius: 20px;
  max-width: 90%;
}
.chat-input-area {
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  border-radius: 0 0 12px 12px;
}
.input-actions {
  display: flex;
  margin-top: 15px;
  justify-content: flex-end;
  gap: 12px;
}
.el-button {
  width: auto;
  margin: 0;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 20px;
}
.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
#wrapper {
  height: 100%;
  width: 100%;
  flex: 1;
}
.opacity-control {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  z-index: 10;
}
.opacity-control span {
  margin-right: 10px;
  color: white;
}
.htmleaf-content {
  position: relative;
}
.error {
  border-block-color: red;
}
.widthclass {
  width: 400px;
}
span {
  color: #67C23A;
}
.opacity-control span {
  color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-container {
    flex-direction: column;
  }
  .avatar-container {
    width: 45%;
    height: 40vh;
  }
  .chat-container {
    width: 55% !important;
    height: 60vh !important;
  }
}

.temp-message {
  opacity: 0.7;
}

.typing-indicator {
  display: inline-block;
  font-weight: bold;
  margin-right: 6px;
  font-size: 21px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.call-button, .hangup-button {
  border-radius: 50%;
  width: 60px;
  height: 60px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.call-button:hover, .hangup-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.call-button i, .hangup-button i {
  font-size: 24px;
}

.hangup-button {
  transform: rotate(135deg);
}

.avatar-chat {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4f1f6 100%);
}

/* 聊天输入框样式优化 */
.chat-textarea >>> .el-textarea__inner {
  border-radius: 16px;
  padding: 18px 24px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 21px;
  resize: none;
  line-height: 1.6;
}

.chat-textarea >>> .el-textarea__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.chat-textarea >>> .el-textarea__inner::placeholder {
  color: #aaaaaa;
  font-style: italic;
  transition: opacity 0.3s;
}

.chat-textarea >>> .el-textarea__inner:focus::placeholder {
  opacity: 0.5;
}

.chat-textarea >>> .el-input__count {
  background: transparent;
  font-size: 18px;
  color: #909399;
  padding: 3px 10px;
  border-radius: 10px;
  position: absolute;
  bottom: 12px;
  right: 15px;
}

/* 状态信息样式 */
.status-info {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 10px;
  color: white;
}

.status-info i {
  margin-right: 4px;
}

.status-info.connected {
  background-color: #67C23A;
}

.status-info.speaking {
  background-color: #409EFF;
}

.status-info.thinking {
  background-color: #E6A23C;
}

.status-info.waiting {
  background-color: #F56C6C;
}

/* 添加Markdown样式 */
.markdown-body {
  color: inherit;
  line-height: 1.6;
  font-size: 21px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 18px;
  margin-bottom: 10px;
  font-weight: 600;
}

.markdown-body h1 {
  font-size: 32px;
}

.markdown-body h2 {
  font-size: 28px;
}

.markdown-body h3 {
  font-size: 26px;
}

.markdown-body pre {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-body code {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 1.2em;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-body a {
  color: #409EFF;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  margin: 8px 0;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  padding: 0 10px;
  color: #6a737d;
  margin: 8px 0;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.markdown-body table th {
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.03);
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-body li {
  margin: 8px 0;
  font-size: 21px;
}

.markdown-body p {
  margin: 12px 0;
  font-size: 21px;
}

/* 针对不同消息类型调整Markdown渲染样式 */
.message.virtual-human .markdown-body {
  color: #333;
}

.message.user .markdown-body {
  color: white;
}

.message.user .markdown-body code,
.message.user .markdown-body pre {
  background-color: rgba(255, 255, 255, 0.1);
}

.message.user .markdown-body a {
  color: #fff;
  text-decoration: underline;
}

/* 确保代码高亮样式生效 */
.hljs {
  background: transparent;
  padding: 0;
}

/* 添加针对操作按钮的固定样式 */
.input-actions .el-button {
  min-width: 90px !important;
  height: 40px !important;
  font-size: 14px !important;
  padding: 0 15px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.input-actions .el-button i {
  margin-right: 5px !important;
  font-size: 16px !important;
}

/* 自定义按钮样式 */
.custom-input-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: flex-end;
}

.custom-button {
  min-width: 140px;
  height: 56px;
  padding: 0 28px;
  border-radius: 10px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 21px;
  font-weight: 500;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.primary-button {
  background-color: #409EFF;
  color: white;
}

.danger-button {
  background-color: #F56C6C;
  color: white;
}

.warning-button {
  background-color: #E6A23C;
  color: white;
}

.disabled-button {
  background-color: #CCCCCC !important;
  color: #999999 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}

.custom-button:not(.disabled-button):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.custom-button:not(.disabled-button):active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-button i {
  margin-right: 10px;
  font-size: 24px;
}

.connection-mode-controls {
  display: flex;
  gap: 10px;
}

.step-by-step-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

.current-step-info {
  text-align: center;
  color: #333;
}

.step-title {
  font-weight: bold;
  font-size: 18px;
  color: #409EFF;
  margin-bottom: 8px;
}

.step-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.step-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.step-controls {
  display: flex;
  gap: 10px;
}

.next-step-button {
  flex: 1;
  font-weight: 500;
}

.step-progress {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
}

.progress-bar {
  height: 100%;
  width: 100%;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mode-switch-button {
  flex: 1;
  font-size: 12px;
}

.step-mode-button {
  border-radius: 50%;
  width: 45px;
  height: 45px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>