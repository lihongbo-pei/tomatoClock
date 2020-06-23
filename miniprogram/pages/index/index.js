//index.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    clockShow:false,
    clockHeight:0,
    time:'5',
    mTime:300000,
    timeStr:'05:00',
    rate:'',
    timer:null,
    cateArr:[
      {
        icon: 'work',
        text: '工作'
      },
      {
        icon: 'study',
        text: '学习'
      },
      {
        icon: 'think',
        text: '思考'
      },
      {
        icon: 'write',
        text: '写作'
      },
      {
        icon: 'sport',
        text: '运动'
      },
      {
        icon: 'read',
        text: '阅读'
      }
    ],
    cateActive:'0',
    okShow:false,
    pauseShow:true,
    continueCancelShow:false
  },

  onLoad: function() {
    var res = wx.getSystemInfoSync();
    var rate = 750 / res.windowWidth;
    console.log(rate);
    this.setData({
      rate:rate,
      clockHeight:rate * res.windowHeight
    })
    
  },

  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },
  slideChange:function(e){
    this.setData({
      time:e.detail.value
    })
  },
  clickCate:function(e){
    this.setData({
      cateActive:e.currentTarget.dataset.index
    })
  },
  start:function(){
    this.setData({
      clockShow:true,
      mTime:this.data.time*60*1000,
      timeStr:parseInt(this.data.time) >= 10 ? this.data.time+':00' : 
      '0' + this.data.time+':00'
    })
    this.drawBg();
    this.drawActivve();
  },
  drawBg:function(){
    var lineWidth = 6 / this.data.rate;//px
    var ctx = wx.createCanvasContext('progress_bg');
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle('#000000');
    ctx.setLineCap('round');
    ctx.beginPath();
    ctx.arc(400/this.data.rate/2,400/this.data.rate/2,400/this.data.rate/2-2*lineWidth,0,2*Math.PI,false);
    ctx.stroke();
    ctx.draw();
  },
  // 动态画圆
  drawActivve:function(){
    var _this = this;
    var timer = setInterval(function(){
      //1.5-3.5
      var angle = 1.5 + 2*(_this.data.time*60*1000 - _this.data.mTime)/
      (_this.data.time*60*1000);
      var currentTime = _this.data.mTime - 100;
      _this.setData({
        mTime:currentTime
      });
      if(angle < 3.5){
        if(currentTime % 1000 == 0){
          var timeStr1 = currentTime / 1000;// s
          var timeStr2 = parseInt(timeStr1 / 60);// m
          var timeStr3 = (timeStr1 - timeStr2*60) >= 10 ? (timeStr1 - timeStr2*60) :
          '0'+(timeStr1 - timeStr2*60);
          var timeStr2 = timeStr2 >= 10 ? timeStr2 : '0'+timeStr2;
          _this.setData({
            timeStr:timeStr2+':'+timeStr3
          })
        }
        var lineWidth = 6 / _this.data.rate;//px
        var ctx = wx.createCanvasContext('progress_active');
        ctx.setLineWidth(lineWidth);
        ctx.setStrokeStyle('#ffffff');
        ctx.setLineCap('round');
        ctx.beginPath();
        ctx.arc(400/_this.data.rate/2,400/_this.data.rate/2,400/_this.data.rate/2-2*lineWidth,
          1.5*Math.PI,angle*Math.PI,false);
        ctx.stroke();
        ctx.draw();
      }else{
        var logs = wx.getStorageSync('logs') || [];
        logs.unshift({
          date:util.formatTime(new Date),
          cate:_this.data.cateActive,
          time:_this.data.time
        });
        wx.setStorageSync('logs', logs);
        _this.setData({
          timeStr:'00:00',
          okShow:true,
          pauseShow:false,
          continueCancelShow:false
        });
        clearInterval(timer);
      }
    },100)
    _this.setData({
      timer:timer
    })
  },
  pause:function(){
    clearInterval(this.data.timer);
    this.setData({
      pauseShow:false,
      continueCancelShow:true,
      okShow:false
    })
  },
  continue:function(){
    this.drawActivve();
    this.setData({
      pauseShow:true,
      continueCancelShow:false,
      okShow:false
    })
  },
  cancel:function(){
    clearInterval(this.data.timer);
    this.setData({
      pauseShow:true,
      continueCancelShow:false,
      okShow:false,
      clockShow:false
    })
  },
  ok:function(){
    clearInterval(this.data.timer);
    this.setData({
      pauseShow:true,
      continueCancelShow:false,
      okShow:false,
      clockShow:false
    })
  }


})
