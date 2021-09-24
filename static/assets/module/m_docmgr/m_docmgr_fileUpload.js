/**
 * 上传文件
 * Created by wrb on 2018/1/11.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_docmgr_fileUpload",
        defaults = {
            doType:1,//1=原组件，2=兼容imaoding yun
            title:null,
            isDialog:true,
            selectedNodeObj:null,//当前选中对象
            param:null,
            fileList:null,//已上传的文件列表
            cancelCallBack:null,
            saveCallBack:null//保存后事件
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._uploadmgrContainer = null;//上传容器
        this._btnNewDir = null;
        this._btnUpload = null;
        this._fileListItemsContainer = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_docmgr/m_docmgr_fileUpload',{});
            that.initHtmlData(html,function () {
                that.bindBtnUpload();
            });
        }
        //初始化数据并加载模板
        ,initHtmlData:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'上传文件',
                    area : '750px',
                    content:html,
                    //btn:false,
                    cancelText:'关闭',
                    cancel:function () {
                        console.log('cancel')
                        if(that.settings.cancelCallBack)
                            that.settings.cancelCallBack();
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //上传文件
        , bindBtnUpload: function () {
            var that = this;
            that._btnUpload = $(that.element).find('.btnUpload:eq(0)');
            that._uploadmgrContainer = $(that.element).find('.uploadmgrContainer:eq(0)');

            //防止重复渲染
            if (that._uploadmgrContainer.find('.uploadmgr').length > 0)
                return false;


            if(that.settings.doType==1){

                that._uploadmgrContainer.m_uploadmgr({
                    server: restApi.url_netFile_uploadFile,
                    btnPickText : '<i class="fa fa-upload"></i>&nbsp;上传附件',
                    ifCloseItemFinished : false,
                    boxClass : 'no-borders',
                    isShowBtnClose : false,
                    auto:true,
                    beforeFileQueued: function (file, m_uploadmgr) {

                        return true;
                    },
                    uploadBeforeSend: function (object, data, headers) {
                        data.companyId = window.currentCompanyId;
                        data.accountId = window.currentUserId;
                        if(that.settings.selectedNodeObj){
                            data.projectId = that.settings.selectedNodeObj.projectId;
                            data.pid = that.settings.selectedNodeObj.id;
                        }
                        if(that.settings.param)
                            $.extend(data, that.settings.param);

                    },
                    uploadSuccessCallback: function (file, res) {
                        if (res.code === '0') {

                        }
                    }
                }, true);

            }else{

                var formData = {
                    //token : 'test',
                    //fileHash : object.file.fileHash;//86f63723a93c481d857ea0aa2938efe3 SparkMD5.ArrayBuffer.hash(object.file),
                    //folderId : '829583273363612',
                    userId : window.baBie.userId
                };
                if(that.settings.param)
                    $.extend(formData, that.settings.param);

                that._uploadmgrContainer.m_yun_upload({
                    server: restApi.url_yun_filePreUpload,//'http://yun.imaoding.com/file/filePreUpload.do',//http://yun.imaoding.com:8001/file/uploadPdf.do',
                    btnPickText : '<i class="fa fa-upload"></i>&nbsp;上传附件',
                    ifCloseItemFinished : false,
                    boxClass : 'no-borders',
                    isShowBtnClose : false,
                    auto:true,
                    chunked:false,
                    fileList:that.settings.fileList,
                    formData:formData,
                    uploadSuccessCallback: function (file, res) {
                        console.log('uploadSuccessCallback');


                    }
                }, true);
            }


            return false;
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
