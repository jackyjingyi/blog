;(function ($, window, document, undefined) {
    "use strict";
    var pluginName = "m_yun_upload",
        defaults = {
            server: null,
            auto: true,//选择文件后是否自动开始上传
            chunked: true,//是否分块上传，需要后台配合
            chunkSize: 5 * 1024 * 1024,
            chunkRetry: 3,
            /*fileExts: 'pdf,zip,rar,gif,jpg,jpeg,bmp,png',*/
            fileExts: '*',
            fileSingleSizeLimit: null,
            btnPickId: null,
            btnPickText: '上传',
            formData: {},
            closeIfFinished: false,
            uploadBeforeSend: null,
            beforeFileQueued: null,
            uploadSuccessCallback: null,
            ifCloseItemFinished:false,//是否关闭上传完成后的列表
            isShowBtnClose: true,//是否显示关闭按钮
            boxClass:null,//uploadmgr元素样式
            fileList:null//已上传的文件列表

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = options;

        this._defaults = defaults;
        this._name = pluginName;
        this._uploader = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initWebUploader();
        }
        ,initWebUploader: function () {
            var that = this;

            var html = template('m_docmgr/m_yun_upload', {
                boxClass:that.settings.boxClass,
                isShowBtnClose:that.settings.isShowBtnClose
            });
            $(that.element).html(html);

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

                    if(file.statusText!='error-doubleName' && file.statusText!='error-exist-doubleName'){
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

                                    var isDoubleName = false;
                                    if(that.settings.fileList && that.settings.fileList.length>0){
                                        $.each(that.settings.fileList,function (i,item) {
                                            if(item.fileName==file.name){
                                                isDoubleName = true;
                                                file.fileId = item.id;
                                                return false;
                                            }
                                        });
                                    }

                                    if(data.code == 0) {//文件不存在

                                        if(isDoubleName==true){//已存在重名
                                            owner.skipFile(file);
                                            file.statusText = 'error-doubleName';
                                            that.alertError(file.name + ' 上传失败(#01)，存在重名文件！' ,file.id);
                                        }
                                        task.resolve();

                                    }else if(data.code == 19){//文件已存在

                                        owner.skipFile(file);
                                        if(isDoubleName==true){//已存在重名
                                            file.statusText = 'error-exist-doubleName';
                                            that.alertError(file.name + ' 上传失败(#01)，存在重名文件！' ,file.id);
                                            //that._uploader.cancelFile( file );

                                        }else{
                                            that.fileExistedPost(file);
                                        }
                                        task.resolve();

                                    } else {

                                        task.reject();
                                    }
                                });
                            });


                        });
                        return task.promise();
                    }


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
                    id: '.btn-select:eq(0)',
                    innerHTML: that.settings.btnPickText || null,
                    multiple: true
                },
                duplicate: false,//是否可重复选择同一文件
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

                if(_.isBlank(file.ext)) {
                    that.alertError(file.name + ' 缺少扩展名，无法加入上传队列',file.id);
                    return false;
                }

                if (that.settings.beforeFileQueued && typeof that.settings.beforeFileQueued === 'function') {
                    if (that.settings.beforeFileQueued(file, that) === false)
                        return false;
                }

                //that._uploader.reset();//单个上传重置队列，防止队列不断增大
                return true;
            });
            that._uploader.on('filesQueued', function (files) {

                console.log('filesQueued');
                console.log(files);

                /*that._uploader.option("formData", {
                    uploadId: WebUploader.Base.guid()
                });*/

                if (files && files.length > 0) {

                    $.each(files, function (index, file) {

                        //添加上传文件列表
                        var html = template('m_docmgr/m_uploadmgr_uploadItem', {file: file});
                        $(that.element).find('.upload-item-list:eq(0)').append(html);
                        that.bindItemAction(file,null);
                        that.showStatusText(file);

                        /*that._uploader.md5File( file ).progress(function(percentage) {
                            //console.log('Percentage:', percentage);
                        }).then(function(val) {
                            console.log('md5 result:', val);
                            file.fileHash=val;

                        });*/

                    });
                    //that.startUpload();//开始上传
                }
            });
            that._uploader.on('startUpload', function (file) {

                console.log('startUpload');

            });
            that._uploader.on('uploadStart', function (file) {
                console.log('uploadStart');
                that.showStatusText(file)
            });
            //进度
            that._uploader.on('uploadProgress', function (file, percentage) {

                console.log('uploadProgress');
                console.log(file.getStatus());

                if(file.statusText=='error')
                    that._uploader.retry(file);

                var pc = (percentage * 100).toFixed(2);
                if (percentage >= 1)
                    pc = 100;
                var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');
                $uploadItem.find('.span_progress:eq(0)').html(pc + '%');
                $uploadItem.find('.progress-bar:eq(0)').attr('aria-valuenow', pc).css('width', pc + '%');
                that.showStatusText(file);

            });
            //当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次
            that._uploader.on("uploadBeforeSend", function (object, data, headers) {

                console.log('uploadBeforeSend');

                if (that.settings.chunked === true)
                    data.chunkPerSize = that.settings.chunkSize;
                if (that.settings.uploadBeforeSend)
                    that.settings.uploadBeforeSend(object, data, headers);


            });
            //当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。
            that._uploader.on("uploadAccept", function (object, response) {

                console.log('uploadAccept');

                if (response.code == 0) {
                    //分片后续处理
                    if (response.data && response.data.needFlow === true) {
                        that._uploader.options.formData.fastdfsGroup = response.data.fastdfsGroup;
                        that._uploader.options.formData.fastdfsPath = response.data.fastdfsPath;
                    }
                    return true;
                } else {
                    if (object && object.file && object.file.name){
                        that.alertError(object.file.name + " 上传失败(#01)，" + response.msg,object.file.id);
                        that.bindItemAction(object.file,response);//重新绑定事件
                    }else{
                        that.alertError("上传失败(#02)，" + response.msg);
                    }
                }

                return false;
            });
            //上传成功
            that._uploader.on('uploadSuccess', function (file, res) {

                console.log('uploadSuccess');

                var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');

                //重名处理
                if(res==undefined && (file.statusText=='error-doubleName' || file.statusText=='error-exist-doubleName')){
                    console.log('file.statusText=='+file.statusText);
                    //that._uploader.retry(file);
                    file.setStatus('error');
                    that.showStatusText(file);
                    return true;

                }else if ((res && res.code == 0) || (res==undefined && file.getStatus()=='complete')) {

                    that.showStatusText(file);

                    if(that.settings.ifCloseItemFinished)
                        $uploadItem.find('a[data-action="removeFile"]').click();

                    if (that.settings.uploadSuccessCallback)
                        that.settings.uploadSuccessCallback(file, res);

                    $('.alertmgr div[data-id="'+file.id+'"]').remove();//删除相关提示

                } else {

                    file.setStatus('error');
                    that.showStatusText(file);
                }


            });
            //当所有文件上传结束时触发
            that._uploader.on("uploadFinished", function () {

                console.log('uploadFinished');

                if (that.settings.closeIfFinished) {
                    var t = setTimeout(function () {
                        $(that.element).find('a.btn-close').click();
                        clearTimeout(t);
                    }, 500);
                }
            });
            //上传失败
            that._uploader.on('uploadError', function (file, reason) {

                //console.log('uploadError');
                //console.log(reason);

                var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');
                if ($uploadItem.length > 0) {
                    if (!!reason) {
                        //$uploadItem.find('.span_status:eq(0)').html('上传失败（' + reason + '）');
                        that.showStatusText(file);
                    }
                    else {
                        //$uploadItem.find('.span_status:eq(0)').html('上传失败');
                        that.showStatusText(file);
                    }
                }
            });
            that._uploader.on('error', function (handler,file) {
                var content;
                switch (handler) {
                    case 'F_EXCEED_SIZE':
                        content = '文件大小超出范围';
                        break;
                    case 'Q_EXCEED_NUM_LIMIT':
                        content = '已超最大的文件上传数';
                        break;
                    case 'Q_TYPE_DENIED':

                        if(that.settings.accept && that.settings.accept.extensions)
                            that.settings.fileExts = that.settings.accept.extensions;

                        if(file!=null && file.size==0){
                            content = '不支持上传空文件';
                        }else{
                            content = '仅支持上传如下类型文件：' + that.settings.fileExts;
                        }
                        break;
                    case 'F_DUPLICATE':
                        content = '文件已经添加';
                        break;
                    default:
                        content = '文件添加失败';
                        break;
                }

                that.alertError(content,file.id);
            });

            that._uploader.on('all', function(type){
                //console.log('============================'+type);
            });

            that.bindAction();
        }

        //开始上传
        ,startUpload:function () {
            var that = this;
            var start = function () {
                var server = that._uploader.option('server');
                if (server === null) {
                    that.alertError('上传路径没有正确配置');
                    return false;
                }

                var files = that._uploader.getFiles();
                if (!files || files.length == 0) {
                    that.alertError('请先选择要上传的文件');
                    return false;
                }

                var errorFiles = [];
                var interruptFiles = [];
                $.each(files, function (index, file) {

                    var fileStatus = file.getStatus();

                    if (fileStatus === 'error') {

                        errorFiles.push(file);
                        that._uploader.retry(file);

                    } else if (fileStatus === 'interrupt') {

                        interruptFiles.push(file);
                        that._uploader.upload(file);
                    }
                });
                if (errorFiles.length + interruptFiles.length > 0) {

                    $.each(interruptFiles, function (index, file) {
                        file.setStatus('error');
                    });
                    that._uploader.retry();
                }
                else
                    that._uploader.upload();
            };

            var option = {
                ignoreError: true,
                url: restApi.url_getCompanyDiskInfo,
                postData: {
                    companyId: window.currentCompanyId
                }
            };
            m_ajax.postJson(option, function (res) {
                if (res.code === '0') {
                    var freeSize = parseFloat(res.data.freeSize);
                    if (freeSize <= 0) {
                        S_toastr.warning("当前组织网盘空间不足，无法上传，请联系客服")
                    } else {
                        start();
                    }
                }
            });
            return false;
        }

        /**
         * inited 初始状态
         * queued 已经进入队列, 等待上传
         * progress 上传中
         * complete 上传完成。
         * error 上传出错，可重试
         * interrupt 上传中断，可续传。
         * invalid 文件不合格，不能重试上传。会自动从队列中移除。
         * cancelled 文件被移除。
         * @param status
         */
        ,showStatusText:function (file) {
            var that = this,statusText = '';
            var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');
            var status = file.getStatus();
            console.log('status=='+status);
            switch (status){
                case 'inited':
                case 'queued':
                    statusText = '待上传';
                    $uploadItem.find('a[data-action="pauseUpload"],a[data-action="continueUpload"]').hide();
                    break;
                case 'progress':
                    statusText = '正在上传';
                    $uploadItem.find('a[data-action="pauseUpload"]').show();
                    $uploadItem.find('a[data-action="continueUpload"]').hide();
                    break;
                case 'complete':
                    statusText = '上传成功';
                    $uploadItem.find('a[data-action="pauseUpload"],a[data-action="continueUpload"]').hide();
                    break;
                case 'error':
                    statusText = '上传失败';
                    $uploadItem.find('a[data-action="pauseUpload"]').hide();
                    $uploadItem.find('a[data-action="continueUpload"]').show();
                    break;
                case 'interrupt':
                    statusText = '已暂停';
                    $uploadItem.find('a[data-action="pauseUpload"]').hide();
                    $uploadItem.find('a[data-action="continueUpload"]').show();
                    break;
                default :
                    statusText = '';
                    $uploadItem.find('a[data-action="pauseUpload"],a[data-action="continueUpload"]').hide();
                    break;
            }
            $uploadItem.find('.span_status:eq(0)').html(statusText);
        }
        //绑定队列按钮事件
        ,bindItemAction:function (file,res) {
            var that = this;
            var className = 'uploadItem_' + file.id;
            var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');

            $uploadItem.find('a[data-action]').off('click').on('click',function () {

                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'removeFile'://停止上传并删除队列

                        $uploadItem.fadeOut('slow',function () {
                            that._uploader.removeFile($uploadItem.attr('data-fileId'),true);
                            $uploadItem.remove();
                            var queryFiles = that._uploader.getFiles('inited','queued','progress','error','interrupt');
                            if(queryFiles.length==0){
                                $(that.element).find('.btn-start:eq(0)').hide();
                            }
                        });
                        return false;
                        break;

                    case 'pauseUpload'://暂停上传

                        if (file.getStatus() === 'progress'){

                            try {
                                that._uploader.stop(file);
                                that.showStatusText(file);
                            } catch (ex) {

                            }
                        }

                        break;

                    case 'continueUpload'://继续上传

                        if(file.statusText=='error-doubleName' || file.statusText=='error-exist-doubleName'){//重命名

                            console.log(file.fileId);

                            S_layer.dialog({
                                title: '继续上传',
                                area : '400px',
                                content:'<div style="padding: 30px 48px;"><a class="btn btn-primary btn-sm " data-action="rename" style="margin-right: 20px;">自动重命名继续上传</a><a class="btn btn-primary btn-sm " data-action="cover">作为该文件的新版本上传</a></div>',
                                cancelText:'关闭',
                                cancel:function () {

                                }

                            },function(layero,index,dialogEle){//加载html后触发

                                //重命名按钮事件
                                $(dialogEle).find('a[data-action="rename"]').click(function () {

                                    S_layer.close($(dialogEle));//关闭弹窗
                                    if(file.skipped==true && file.statusText=='error-exist-doubleName'){
                                        that.fileExistedPost(file);
                                    }else{
                                        that._uploader.retry(file);
                                    }

                                });
                                //覆盖按钮事件
                                $(dialogEle).find('a[data-action="cover"]').click(function () {

                                    S_layer.close($(dialogEle));//关闭弹窗

                                    $('.alertmgr div[data-id="'+file.id+'"]').remove();//删除相关提示

                                    that._uploader.option('formData', {fileId:file.fileId});

                                    //进度条元素属性更换
                                    //file.id = res.data.netFileId;
                                    //$uploadItem.attr('data-fileid',file.id);
                                    //$uploadItem.removeClass(className).addClass('uploadItem_' + file.id);
                                    if(file.skipped==true && file.statusText=='error-exist-doubleName'){
                                        that.fileExistedPost(file,1);
                                    }else{
                                        that._uploader.retry(file);
                                    }

                                });

                            });


                        }else{
                            that._uploader.upload(file);
                        }

                        break;
                }
            });
        }
        //绑定按钮
        ,bindAction: function () {
            var that = this;

            $(that.element).find('.btn-start:eq(0)').click(function () {

                var start = function () {
                    var server = that._uploader.option('server');
                    if (server === null) {
                        that.alertError('上传路径没有正确配置');
                        return false;
                    }

                    var files = that._uploader.getFiles();
                    if (!files || files.length == 0) {
                        that.alertError('请先选择要上传的文件');
                        return false;
                    }

                    var i = 0;
                    $('.upload-item-list .span_status').each(function () {
                        var text = $(this).text();
                        if(text=='已暂停'){
                            $(this).text('待上传');
                            i++;
                        }
                    });
                    if(i>0){
                        $(that.element).find('.btn-start:eq(0)').hide();
                        $(that.element).find('.btn-pause:eq(0)').show();
                    }

                    var errorFiles = [];
                    var interruptFiles = [];
                    $.each(files, function (index, file) {

                        var fileStatus = file.getStatus();

                        if (fileStatus === 'error') {

                            errorFiles.push(file);
                            that._uploader.retry(file);

                        } else if (fileStatus === 'interrupt') {

                            interruptFiles.push(file);
                            that._uploader.upload(file);
                        }
                    });
                    if (errorFiles.length + interruptFiles.length > 0) {

                        $.each(interruptFiles, function (index, file) {
                            file.setStatus('error');
                        });
                        that._uploader.retry();
                    }
                    else
                        that._uploader.upload();
                };

                var option = {
                    ignoreError: true,
                    url: restApi.url_getCompanyDiskInfo,
                    postData: {
                        companyId: window.currentCompanyId
                    }
                };
                m_ajax.postJson(option, function (res) {
                    if (res.code === '0') {
                        var freeSize = parseFloat(res.data.freeSize);
                        if (freeSize <= 0) {
                            S_toastr.warning("当前组织网盘空间不足，无法上传，请联系客服")
                        } else {
                            start();
                        }
                    }
                });


                return false;
            });

            //停止
            $(that.element).find('.btn-pause:eq(0)').click(function () {
                var files = that._uploader.getFiles();
                if (files && files.length > 0) {
                    $.each(files, function (index, file) {
                        if (file.getStatus() === 'progress');
                        {
                            try {
                                that._uploader.stop(file);
                            } catch (ex) {

                            }
                            if (file.getStatus() === 'interrupt') {
                                var $uploadItem = $(that.element).find('.uploadItem_' + file.id + ':eq(0)');
                                $uploadItem.find('.span_status:eq(0)').html('已暂停');
                                that.bindContinueUpload(file);
                            }
                        }
                    });
                }
                $(that.element).find('.btn-pause:eq(0)').hide();
                $(that.element).find('.btn-start:eq(0)').show();
            });

            //关闭
            $(that.element).find('.btn-close:eq(0)').click(function () {
                if (that._uploader.isInProgress()) {
                    that.alertError("当前正在上传，无法关闭")
                } else {
                    var files = that._uploader.getFiles();
                    if (files && files.length > 0) {
                        $.each(function (index, file) {
                            that._uploader.removeFile(file, true);
                        });
                    }
                    that._uploader.destroy();
                    $(that.element).html('');
                }
                return false;
            });
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
        //暂时未用
        ,onError: function (file, msg) {
            //showMsg
            //为了可以重试，设置为错误状态
            file.setStatus('error');
            var that = this;
            that.alertError(file.name + ' ' + msg);
        }
        //错误提示
        ,alertError: function (content, alertId) {
            var that = this;
            var html = template('m_alert/m_alert_error', {content: content, id: alertId});
            $(that.element).find('.alertmgr:eq(0)').append(html);
        }
        //获取WebUploader实例
        ,getUploader: function () {
            var that = this;
            return that._uploader;
        }
        ,refresh:function(){
            this._uploader.refresh();
        }
        ,getToken:function (param,callBack) {
            var that = this;
            var option  = {};
            option.async = false;
            option.url = restApi.url_getToken;
            option.postData = param;
            if(that.settings.formData){
                option.postData.folderId = that.settings.formData.folderId;
                option.postData.userId = that.settings.formData.userId;
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
