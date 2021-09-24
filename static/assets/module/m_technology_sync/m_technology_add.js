/**
 * 技术协同-编辑
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_technology_add",
        defaults = {
            isDialog:true,
            type:null,//1.编辑创新委员会 2.编辑成员
            tempData:'',
            cancelCallBack:null,//取消回调
            saveCallBack:null//回调函数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._fileFullPath = null;
        this._fileName = null;
        this._fileId = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var   placeholderTitle = '添加会议纪要文件标题';
            var html = template('m_technology_sync/m_technology_add', {
                placeholderTitle:placeholderTitle
            });
            that.renderDialog(html,function () {
                that.uploadRecordFile();

                if(that.settings.id){
                    $(that.element).find('input[name="remark"]').val(that.settings.dataItem.content);
                    var fileData = {
                        netFileId:that.settings.dataItem.fileId,
                        fileName: that.settings.dataItem.fileName,
                        fullPath: that.settings.dataItem.fileFullPath
                    };
                    that._fileId =that.settings.dataItem.fileId,
                    that._fileName = that.settings.dataItem.fileName,
                    that._fileFullPath =that.settings.dataItem.fileFullPath
                    if (!isNullOrBlank(fileData.netFileId)) {
                        var html = template('m_common/m_attach_no_delete', fileData);
                        $('#showFileLoading').html(html);

                        that._attachCoverList = [];
                        that._attachCoverList.push({
                            id: fileData.netFileId
                        });

                        that.bindOpenImgClick();
                    }
                }

                that.save_validate();
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                var dialogTitle =that.settings.id?'编辑会议纪要': '添加会议纪要';

                S_layer.dialog({
                    title: that.settings.title||dialogTitle,
                    area : '780px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();

                        if(!that._fileId){
                            S_toastr.error('请上传会议纪要文件');
                            return false;
                        }

                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).closest('table').find('tbody').append(html);
                that.element = $(that.element).closest('table').find('tbody tr:last');
                if(callBack)
                    callBack();
            }
        }
        //上传附件
        ,uploadRecordFile: function () {
            var that = this;
            $(that.element).find('a[data-action="recordAttach"]').m_fileUploader({
                server: restApi.url_attachment_uploadSummaryFile,
                fileExts: '*',
                fileSingleSizeLimit:20*1024*1024,
                formData: {},
                multiple:true,
                //duplicate:false,

                loadingId: '#content-right',
                innerHTML: '<i class="fa fa-upload fa-fixed"></i>',
                uploadBeforeSend: function (object, data, headers) {
                    data.companyId = window.currentCompanyId;
                    data.accountId = window.currentUserId;
                },
                uploadSuccessCallback: function (file, response) {
                    //console.log(response)
                    S_toastr.success('上传成功！');
                    var fileData = {
                        netFileId: response.data.netFileId,
                        fileName: response.data.fileName,
                        fullPath: response.data.fileFullPath
                    };
                    that._fileId = response.data.netFileId;
                    that._fileName = response.data.fileName;
                    that._fileFullPath = response.data.fileFullPath;
                    if (!isNullOrBlank(fileData.netFileId)) {
                        var html = template('m_common/m_attach_no_delete', fileData);
                        $('#showFileLoading').html(html);

                        that._attachCoverList = [];
                        that._attachCoverList.push({
                            id: fileData.netFileId
                        });

                        that.bindOpenImgClick();
                    }
                }
            },true);
        }
        //事件绑定
        ,bindOpenImgClick:function () {
            var that = this;
            $.each($('#showFileLoading').find('a[data-action="preview"]'), function (i, o) {
                $(o).off('click.preview').on('click.preview', function () {
                    window.open($(this).attr('data-src'));
                })
            });
        }
        //保存验证
        ,save_validate: function ($ele) {
            var that = this;

            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('form').validate({
                rules: {
                    remark: {
                        required: true,
                    },
                },
                messages: {
                    remark: {
                        required: '会议纪要名称不能为空',
                    },
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    if(element.closest('.row-edit-item').length>0){
                        error.appendTo(element.closest('.row-edit-item'));
                    }else{
                        error.appendTo(element.closest('.col-sm-10'));
                    }

                }
            });
        }
        //保存签发
        ,save:function (e) {
            var options={},that=this;
            options.url=restApi.url_saveSkillSynergyInfo;
            options.postData = {};
            options.postData.content = $(that.element).find('input[name="remark"]').val();
            options.postData.type = that.settings.type;
            options.postData.id = that.settings.id ;
            options.postData.companyId = that._currentCompanyId;
            options.postData.fileId = that._fileId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
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
