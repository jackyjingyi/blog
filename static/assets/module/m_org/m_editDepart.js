/**
 * 添加部门，编辑部门
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editDepart",
        defaults = {
            title:'',
            isDialog:true,
            departObj:null,
            doType:'add',//默认添加 edit=编辑
            orgUserList:null,//部门负责人选择列表
            saveCallBack:null,//保存回滚事件
            delCallBack:null,//删除回滚事件
            fileId :null,//封面ID
            fileName :null,//封面名称
            fileFullPath :null,//封面路径
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._coverId = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var $data = {};
            $data.departObj={};
            $data.parentDepart=that.settings.departObj.parentDepart;
            $data.departList=that.settings.departList;
            if(that.settings.doType=='edit'){
                $data.departObj = that.settings.departObj;
                $data.doType = that.settings.doType;
            }
            var html = template('m_org/m_editDepart',$data);
            that.initHtmlData(html,function () {
                that.initCoverData();
                that.initSelect2();
                that.bindActionClick();
                that.uploadRecordFile();
                that.saveDepart_validate();

            });
        }
        //初始化数据并加载模板
        ,initHtmlData:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加部门',
                    area : '650px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if ($(that.element).find('form').valid()) {

                            that.saveDepart();

                        } else {

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
        ,initCoverData:function(){
            var that = this;
            if(isNullOrBlank(that.settings.fileId)){
                return;
            }
            var fileData = {
                netFileId: that.settings.fileId,
                fileName: that.settings.fileName,
                fullPath:that.settings.fileFullPath
            };
            that._coverId = that.settings.fileId;
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
        ,initSelect2:function () {
            var that = this;
            var $select = $(that.element).find('select[name="departType"]');
            $select.select2({
                allowClear: false,
                language: "zh-CN",
                width: '100%',
                minimumResultsForSearch: Infinity,
                placeholder: "请选择部门类型!"
            });
            if(that.settings.departObj && that.settings.departObj.departType){
                $select.val(that.settings.departObj.departType).trigger('change');
            }
            var $selectPid = $(that.element).find('select[name="pid"]');
            $selectPid.select2({
                allowClear: false,
                language: "zh-CN",
                width: '100%',
                minimumResultsForSearch: Infinity,
                placeholder: "请选择上级部门!"
            });
            if(that.settings.departObj.parentDepart && that.settings.departObj.parentDepart.id){
                $selectPid.val(that.settings.departObj.parentDepart.id).trigger('change');
            }
        }
        //部门保存
        ,saveDepart:function (e) {
            var that = this;
            var option  = {};
            option.classId = 'body';
            option.url = restApi.url_saveOrUpdateDepart;

            var departObj = $(that.element).find('form').serializeObject();

            if(that.settings.doType=='edit'){
                departObj.parentDepart = getObjectInArray(that.settings.departList,departObj.pid)
                option.postData = that.settings.departObj;
                departObj.fileId = that._coverId;
                option.postData = $.extend({}, option.postData, departObj);

            }else{

                departObj.parentDepart = that.settings.departObj.parentDepart;
                departObj.pid = that.settings.departObj.parentDepart.id;
                departObj.fileId = that._coverId;
                departObj.companyId = that.settings.departObj.parentDepart.companyId;
                option.postData = departObj;
            }



            m_ajax.postJson(option,function (response) {
                if(response.code=='0') {
                    S_toastr.success('保存成功！');
                    if (response.data) {
                        if (that.settings.saveCallBack != null){
                            if(that.settings.departObj.parentDepart.id==departObj.pid){
                                //没有更换上级部门
                                response.data.isChangePid = false;
                            }else{
                                //更换上级部门
                                response.data.isChangePid = true;
                            }
                            return that.settings.saveCallBack(response.data);
                        }
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;
            $('.editDepartOBox button[data-action]').on('click',function () {
                var dataAction = $(this).attr('data-action');
                if(dataAction=='saveDepart'){//保存部门
                    that.saveDepart($(this));
                    return false;

                }else if(dataAction=='delDepart'){//删除部门
                    that.delDepart($(this));
                    return false;
                }
            });
        }
        ,saveDepart_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    departName:{
                        required:true,
                        maxlength:50
                    }

                },
                messages: {
                    departName:{
                        required:'请输入部门名称!',
                        maxlength:'部门名称不超过50位!'
                    }
                }
            });

        }
        , bindFileUpload:function () {
            var that =this;
            var option = {};
            that._uploadmgrContainer = $(that.element).find('.uploadmgrContainer:eq(0)');
            option.server =restApi.url_attachment_uploadDepartCover, //'http://192.168.1.114:8071/fileCenter/attachment/uploadDepartCover';//
                option.accept={
                    title: '上传封面',
                    extensions: 'jpg,jpeg,png,gif,bmp',
                    mimeTypes: '*'
                };
            option.btnPickText = '<i class="fa fa-upload"></i>&nbsp;上传封面';
            option.ifCloseItemFinished = true;
            option.boxClass = 'no-border';
            option.isShowBtnClose = false;
            option.uploadBeforeSend = function (object, data, headers) {

            };
            option.uploadSuccessCallback = function (file, response) {
                var fileData = {
                    netFileId: response.data.netFileId,
                    fileName: response.data.fileName,
                    fullPath: response.data.fileFullPath
                };
                var $uploadItem = that._uploadmgrContainer.find('.uploadItem_' + file.id + ':eq(0)');
                if (!isNullOrBlank(fileData.netFileId)) {
                    $uploadItem.find('.span_status:eq(0)').html('上传成功');
                    var html = template('m_common/m_attach', fileData);
                    $('#showFileLoading').html(html);

                    that._attachList = [];
                    that._attachList.push({
                        id:fileData.netFileId
                    });

                    that.bindOpenImgClick();

                } else {
                    $uploadItem.find('.span_status:eq(0)').html('上传失败');
                }

            };
            that._uploadmgrContainer.m_uploadmgr(option, true);
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
        //上传附件
        ,uploadRecordFile: function () {
            var that = this;
            $(that.element).find('a[data-action="recordAttach"]').m_fileUploader({
                server: restApi.url_attachment_uploadDepartImg,
                fileExts: 'gif,jpg,jpeg,bmp,png',
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
                    that._coverId = response.data.netFileId;
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
