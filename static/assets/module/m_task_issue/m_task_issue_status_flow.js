/**
 * 任务签发-状态流转
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_status_flow",
        defaults = {
             isDialog:true
            ,dataInfo:null
            ,saveCallBack:null
            ,doType:1//默认1=签发,2=生产
            ,isPanel:0//1=父
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._uuid = UUID.genV4().hexNoDelim;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue_status_flow',{
                title:that._title,
                subTitle:that._subTitle,
                dataInfo:that.settings.dataInfo,
                currentCompanyId:that._currentCompanyId,
                doType:that.settings.doType,
                isPanel:that.settings.isPanel
            });
            that.renderDialog(html,function () {

                that.initICheck();
                that.save_validate();
                that.bindFileUplad();

            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:that.settings.title || '状态流转',
                    area : '750px',
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    cancel:function () {

                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
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
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        //初始化iCheck
        ,initICheck:function () {

            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {
                var state = $(this).val();
                if(state==5){
                    $(that.element).find('div[data-type="5"]').removeClass('hide');
                    that._uploadmgrContainer.m_uploadmgr('refresh');
                }else{
                    $(that.element).find('div[data-type="5"]').addClass('hide');

                }
                $(that.element).find('label#endStatus-error').remove();
            };
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);

        }
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_submitCheckAudit;
            option.postData = {};

            option.postData.endStatus = $(that.element).find('input[name="endStatus"]:checked').val();

            if(option.postData.endStatus==5){
                option.postData.remark = $(that.element).find('textarea[name="remark"]').val();
                option.postData.targetId = that._uuid;
                option.postData.taskId = that.settings.dataInfo.id;
            }else{
                option.url = restApi.url_updateProjectBaseData;
                option.postData.id = that.settings.dataInfo.id;
            }
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    endStatus: {
                        required: true
                    }
                },
                messages: {
                    endStatus: {
                        required: '请选择状态'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置

                    error.appendTo(element.closest('.col-sm-10').find('.row .col-sm-10'));

                }
            });
        }
        , bindFileUplad:function () {
            var that =this;
            var option = {};
            that._uploadmgrContainer = $(that.element).find('.uploadmgrContainer:eq(0)');
            option.server = restApi.url_attachment_uploadExpenseAttach;
            option.accept={
                title: '上传附件',
                extensions: '*',
                mimeTypes: '*'
            };
            option.btnPickText = '<i class="fa fa-upload"></i>&nbsp;上传附件';
            option.ifCloseItemFinished = true;
            option.boxClass = 'no-borders';
            option.isShowBtnClose = false;
            option.uploadBeforeSend = function (object, data, headers) {
                data.companyId = window.currentCompanyId;
                data.accountId = window.currentUserId;
                data.targetId = that._uuid;
            };
            option.uploadSuccessCallback = function (file, response) {
                var fileData = {
                    netFileId: response.data.netFileId,
                    fileName: response.data.fileName,
                    fullPath: window.fastdfsUrl + response.data.fastdfsGroup + '/' + response.data.fastdfsPath
                };
                var $uploadItem = that._uploadmgrContainer.find('.uploadItem_' + file.id + ':eq(0)');
                if (!isNullOrBlank(fileData.netFileId)) {
                    $uploadItem.find('.span_status:eq(0)').html('上传成功');
                    var html = template('m_common/m_attach', fileData);
                    $('#showFileLoading').append(html);
                    if(!$('#showFileLoading').parent().hasClass('m-b-sm'))
                        $('#showFileLoading').parent().addClass('m-b-sm');

                    that.bindAttachDelele();
                } else {
                    $uploadItem.find('.span_status:eq(0)').html('上传失败');
                }

            };
            that._uploadmgrContainer.m_uploadmgr(option, true);

        }
        , bindAttachDelele: function () {
            $.each($('#showFileLoading').find('a[data-action="deleteAttach"]'), function (i, o) {
                $(o).off('click.deleteAttach').on('click.deleteAttach', function () {
                    var netFileId = $(this).attr('data-net-file-id');

                    var ajaxDelete = function () {
                        var ajaxOption = {};
                        ajaxOption.classId = '.file-list:eq(0)';
                        ajaxOption.url = restApi.url_attachment_delete;
                        ajaxOption.postData = {
                            id: netFileId,
                            accountId: window.currentUserId
                        };
                        m_ajax.postJson(ajaxOption, function (res) {
                            if (res.code === '0') {
                                S_toastr.success("删除成功");
                            } else if (res.code === '1') {
                                S_layer.error(res.msg);
                            }
                        });
                    };
                    ajaxDelete();

                    $(this).closest('span').remove();
                })
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
