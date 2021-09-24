;(function ($, window, document, undefined) {
    "use strict";

    var pluginName = "m_yun_fileUploader",
        defaults = {
            server: null,
            auto: true,//选择文件后是否自动开始上传
            chunked: false,//是否分块上传，需要后台配合
            chunkSize: 5 * 1024 * 1024,
            chunkRetry: 3,
            fileExts: 'pdf,zip,rar,doc,docx,xls,xlsx,ppt,pptx,txt',
            fileSingleSizeLimit: null,
            formData: {},
            uploadBeforeSend: null,
            uploadSuccessCallback: null,
            uploadProgressCallback: null,//进度处理方法
            loadingId: null,//锁屏加载ID
            multiple:false,//是否上传多个文件
            duplicate:true//是否可重复选择同一文件
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._lastUploadFile = null;
        this._uploader = null;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._initWebUploader();
        },
        _initWebUploader: function () {
            var that = this;

            WebUploader.Uploader.unRegister('custom');
            //监听分块上传过程中的三个时间点
            WebUploader.Uploader.register({
                name: 'custom',
                'before-send-file': 'beforeSendFile',//时间点1：所有分块进行上传之前调用此函数
                'before-send': 'beforeSend',//时间点2：如果有分块上传，则每个分块上传之前调用此函数
                'after-send-file': 'afterSendFile'//时间点3：所有分块上传成功后调用此函数
            }, {
                beforeSendFile: function(file) {

                    console.log('beforeSendFile=='+file.statusText);

                    var task = new WebUploader.Deferred();
                    var owner = this.owner;
                    (new WebUploader.Uploader()).md5File(file).progress(function(percentage) {}).then(function(val) {
                        var url = restApi.url_yun_filePreUpload;
                        var data = {
                            fileHash : val,
                            fileName : file.name,
                            fileSize : file.size
                        };

                        that.getToken(data,function (resData) {
                            that.settings.formData.token = resData;
                            $.extend(data, that.settings.formData);

                            $.ajax({
                                type: 'POST',
                                url: url,
                                data: data,
                                cache: false,
                                async: false, // 同步
                                timeout: 1000, // todo 超时的话，只能认为该分片未上传过
                                dataType: 'json',
                                error: function(XMLHttpRequest, textStatus, errorThrown) {
                                    file.statusText = 'server_error';
                                    task.reject();
                                }
                            }).then(function(data, textStatus, jqXHR) {
                                //console.log(data)
                                that._uploader.option('server', data.url);
                                that._uploader.option('formData', {fileHash:val});
                                that._uploader.option('formData', {token:that.settings.formData.token});

                                if(data.code == 0) {//文件不存在

                                    task.resolve();

                                }else if(data.code == 19){//文件已存在

                                    owner.skipFile(file);
                                    that.fileExistedPost(file);
                                    task.resolve();

                                } else {

                                    task.reject();
                                }
                            });
                        });


                    });
                    return task.promise();


                },
                afterSendFile: function(file) {

                    //console.log('afterSendFile');

                }
            });

            that._uploader = WebUploader.create({
                fileSingleSizeLimit: that.settings.fileSingleSizeLimit,
                compress: false,// 不压缩image
                auto: that.settings.auto,
                swf: window.rootPath + '/lib/webuploader/Uploader.swf',
                server: that.settings.server,
                //timeout: 600000,
                pick: {
                    id: that.element,
                    innerHTML: that.settings.innerHTML || '上传',
                    multiple: that.settings.multiple
                },
                duplicate: that.settings.duplicate,//是否可重复选择同一文件
                resize: false,
                chunked: that.settings.chunked,
                chunkSize: that.settings.chunkSize,
                chunkRetry: that.settings.chunkRetry,
                formData: that.settings.formData,
                accept: that.settings.accept || {
                    extensions: that.settings.fileExts
                },
                threads: 1,
                disableGlobalDnd: true
            });
            //文件队列
            that._uploader.on('beforeFileQueued', function (file) {
                if (_.isBlank(file.ext)) {
                    S_layer.error(file.name + ' 缺少扩展名，无法加入上传队列');
                    return false;
                }

                if (that._uploader.isInProgress()) {
                    //console.log('当前正在上传，禁止添加新文件到队列中');
                    return false;
                }
                if(!that.settings.multiple){
                    that._uploader.reset();//单个上传重置队列，防止队列不断增大
                }
                return true;
            });
            that._uploader.on('fileQueued', function (file) {
                that._lastUploadFile = file;
                that._uploader.option("formData", {
                    uploadId: WebUploader.Base.guid()
                });
            });
            that._uploader.on('startUpload', function (file) {
                if (!isNullOrBlank(that.settings.loadingId))
                    S_loading.show(that.settings.loadingId, '正在上传中...');
            });
            that._uploader.on('uploadStart', function (file) {
                //console.log('uploadStart.');
            });
            that._uploader.on('uploadProgress', function (file, percentage) {
                //console.log(percentage);
                if (that.settings.uploadProgressCallback != null) {
                    that.settings.uploadProgressCallback(file, percentage);
                }
            });
            //当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次
            that._uploader.on("uploadBeforeSend", function (object, data, headers) {
                if (that.settings.chunked === true)
                    data.chunkPerSize = that.settings.chunkSize;
                if (that.settings.uploadBeforeSend)
                    that.settings.uploadBeforeSend(object, data, headers);
            });
            //当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。
            that._uploader.on("uploadAccept", function (object, response) {
                if (!handleResponse(response)) {
                    if (response.code) {
                        if (response.code === '0' && response.data) {
                            //分片后续处理
                            if (response.data.needFlow === true) {
                                that._uploader.options.formData.fastdfsGroup = response.data.fastdfsGroup;
                                that._uploader.options.formData.fastdfsPath = response.data.fastdfsPath;
                            }
                            return true;
                        } else {

                            var errorMsg = response.msg != null && response.msg != undefined ? response.msg : (response.info != null && response.info != undefined ? response.info : '');

                            if (object && object.file && object.file.name) {
                                object.file.uploadAcceptFailed = true;
                                object.file.uploadAcceptFailedMsg = errorMsg;
                            }
                            else
                                that._onError(null, "上传失败(#02)，" + errorMsg);
                        }
                    }
                }
                //返回False触发uploadError
                return false;
            });
            //上传成功
            that._uploader.on('uploadSuccess', function (file, response) {
                //console.log('uploadSuccess');
                //console.log(response);
                if (!isNullOrBlank(that.settings.loadingId))
                    S_loading.close(that.settings.loadingId);

                if (!handleResponse(response)) {
                    if (response.code === '0') {
                        if (that.settings.uploadSuccessCallback)
                            that.settings.uploadSuccessCallback(file, response);
                    }
                    else {
                        var errorMsg = response.msg != null && response.msg != undefined ? response.msg : (response.info != null && response.info != undefined ? response.info : '');
                        that._onError(file, errorMsg);
                    }
                }
            });
            //当所有文件上传结束时触发
            that._uploader.on("uploadFinished", function () {
                //console.log("uploadFinished");
            });
            //上传失败
            that._uploader.on('uploadError', function (file, reason) {
                if (!isNullOrBlank(that.settings.loadingId))
                    S_loading.close(that.settings.loadingId);
                if (file.uploadAcceptFailed === true)
                    that._onError(file, file.uploadAcceptFailedMsg)
                else
                    that._onError(file, "上传失败，" + reason);
            });
            that._uploader.on('error', function (handler) {
                var content;
                switch (handler) {
                    case 'F_EXCEED_SIZE':
                        content = '文件大小超出范围（' + that.settings.fileSingleSizeLimit / (1024 * 1024) + 'MB）';
                        break;
                    case 'Q_EXCEED_NUM_LIMIT':
                        content = '已超最大的文件上传数';
                        break;
                    case 'Q_TYPE_DENIED':

                        if(that.settings.accept && that.settings.accept.extensions)
                            that.settings.fileExts = that.settings.accept.extensions;

                        content = '仅支持上传如下类型文件：' + that.settings.fileExts;
                        break;
                    case 'F_DUPLICATE':
                        content = '文件已经添加';
                        break;
                    default:
                        content = '文件添加失败';
                        break;
                }
                that._onError(that._lastUploadFile, content);
            });
        },
        _onError: function (file, msg) {
            var that = this;
            //为了可以重试，设置为错误状态
            if (file !== void 0 && file !== null)
                file.setStatus('error');
            that._debounceShowError(msg);
        },
        _debounceShowError: _.debounce(function (msg) {
            S_toastr.error(msg);
        }, 200),
        //获取WebUploader实例
        getUploader: function () {
            var that = this;
            return that._uploader;
        }
        //文件已存在服务器，秒传
        ,fileExistedPost:function (file,t) {
            var that = this;
            var url = that._uploader.options.server;
            var data = {
                fileHash : that._uploader.options.formData.fileHash,
                fileName : file.name,
                fileSize : file.size
            };
            $.extend(data, that.settings.formData);

            if(!isNullOrBlank(file.fileId) && t==1)
                data.fileId = file.fileId;

            $.ajax({
                type: 'POST',
                url: url,
                data: data,
                cache: false,
                async: false, // 同步
                timeout: 1000, // todo 超时的话，只能认为该分片未上传过
                dataType: 'json',
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    file.statusText = 'server_error';
                }
            }).then(function(data, textStatus, jqXHR) {

                if(data.code == 0) {

                    var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');
                    $uploadItem.find('.span_progress:eq(0)').html('100%');
                    $uploadItem.find('.progress-bar:eq(0)').attr('aria-valuenow', 100).css('width', 100 + '%');
                    file.setStatus('complete');
                    that.showStatusText(file);
                    $('.alertmgr div[data-id="'+file.id+'"]').remove();//删除相关提示
                    if (that.settings.uploadSuccessCallback)
                        that.settings.uploadSuccessCallback(file);

                }else{

                }
            });
        }
        ,getToken:function (param,callBack) {
            var that = this;
            var option  = {};
            option.async = false;
            option.url = restApi.url_getToken;
            option.postData = param;
            if(that.settings.formData){
                option.postData.folderId = 0;
                option.postData.userId = 1;
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
