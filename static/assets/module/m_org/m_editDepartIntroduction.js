/**
 * 组织－组织架构-编辑研究组简介
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editDepartIntroduction",
        defaults = {
            departId: null,//组织信息对象
            fileFullPath:null,
            projectList: [],
            explainDesc:null,
            isPreviewBack:false,
            businessType:1,
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._currTreeObj = null;
        this._cdnUrl = window.cdnUrl;
        this._fileFullPath = null;
        this._fileName = null;
        this._fileId = null;
        this._projectList = [];
        this._explainDesc = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            if(that.settings.isPreviewBack){
                    var data = {
                        projectList: that.settings.projectList,
                        fileFullPath: that.settings.fileFullPath,
                        fileId: that.settings.fileId,
                        fileName: that.settings.fileName,
                        explainDesc: that.settings.explainDesc,
                    };
                    that._fileFullPath = data.fileFullPath;
                    that._fileId = data.fileId;
                    that._fileName = data.fileName;
                    that._projectList = data.projectList;
                    that._explainDesc = data.explainDesc;
                    that._renderHtml(data);
                    that._bindActionClick();
                    that._bindBackTolast();

            }else{
                that.getDepartInfo(function (data) {
                    that._fileFullPath = data.fileFullPath;
                    that._fileId = data.fileId;
                    that._fileName = data.fileName;
                    that._projectList = data.projectList;
                    that._explainDesc = data.explainDesc;
                    that._renderHtml(data);
                    that._bindActionClick();
                    that._bindBackTolast();
                })
            }

        }
        ,getDepartInfo:function(callBack){
            var that = this;
            var option  = {};
            option.url = that.settings.businessType==1?restApi.url_property_getCompanyPropertyById:restApi.url_getDepartDetailsInfo;
            option.postData = {};
            option.postData.id = that.settings.departId; //研究类型的时候 id 为部门ID ,当我是业务类型的时候 id 为 项目类型的id
            option.postData.businessType = that.settings.businessType; //1业务类型 2研究类型
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    var resopnseData= response.data;
                    if(callBack){
                        callBack(resopnseData);
                    }
                }else {
                    S_layer.error(response.info);
                }

            })
        }
        //渲染界面
        , _renderHtml: function (data) {
            var that = this;
            var renderData = {
              fileFullPath: data.fileFullPath,
              fileName: data.fileName,
                fileId: data.fileId,
                projectList: data.projectList,
            };
            that._explainDesc = data.explainDesc;
            var html = template('m_org/m_editDepartIntroduction', renderData);
            $(that.element).html(html);
            that.uploadRecordFile();
            var pageHeight = document.body.scrollHeight -144;
            var height =pageHeight + "px";
            $(that.element).find('.middleLine').css("height",height);
            $(that.element).find('#remarkEditor').m_text_editor({
                isVideo:false,
                isPicture:true,
                placeholder:'请输入内容',
                height:700,
                onInit:function () {
                    $(that.element).find('#remarkEditor .summernote').summernote('code', that._explainDesc?that._explainDesc:'');
                }
            },true);
        }

        //按钮事件绑定
        , _bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction) {
                    case 'save':
                        //保存数据
                        that.saveDepart();
                        break;
                    case 'preview':
                        //预览数据
                        that.preview();
                        return false;
                        break;
                }
            });

            $.each($(that.element).find('a[data-action="projectAction"]'), function (i, o) {
                $(o).off('click.projectAction').on('click.projectAction', function () {
                    var projectId = $(this).attr('data-key');
                    $(that.element).find('#remarkEditor .summernote').summernote('destroy');
                    that.editDepartSubject(projectId);
                })
            });
        }
        //返回按钮绑定
        , _bindBackTolast: function () {
            var that = this;
            $(that.element).find("a[data-action='backToLast']").on('click', function () {
                $(that.element).find('#remarkEditor .summernote').summernote('destroy');
                if(that.settings.businessType==1){
                    $(that.element).m_project_temp_tab({
                        query:that.settings.query,isEditIntroductionBack:true
                    }, true);
                }else{
                    $(that.element).m_organizational();
                }
            });
        }
        ,editDepartSubject:function(projectId){
            var option = {}, that = this;
            option.projectId = projectId;
            option.departId = that.settings.departId;
            option.businessType = that.settings.businessType;
            $(that.element).m_editDepartSubject(option);
        }
        ,preview:function(){
            var option = {}, that = this;
            option.departId = that.settings.departId;
            option.fileFullPath = that._fileFullPath;
            option.fileName = that._fileName;
            option.fileId = that._fileId;
            option.explainDesc =  $(that.element).find('#remarkEditor .summernote').summernote('code');
            option.projectList = that._projectList;
            option.businessType = that.settings.businessType;
            $(that.element).find('#remarkEditor .summernote').summernote('destroy');
            $(that.element).m_editDepartIntroductionPreview(option);
        }
        //上传附件
        ,uploadRecordFile: function () {
            var that = this;
            $(that.element).find('a[data-action="recordAttach"]').m_fileUploader({
                server: restApi.url_attachment_uploadDepartCover,
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
        //保存数据
        ,saveDepart:function () {
            var that = this;
            var option  = {};
            option.url = that.settings.businessType==1?restApi.url_property_saveCompanyPropertInfo:restApi.url_saveDepartDetails;
            option.postData = {};
            if(that.settings.businessType==1){
                option.postData.id = that.settings.departId;
                option.postData.explainDesc =  $(that.element).find('#remarkEditor .summernote').summernote('code');
            }else{
                option.postData.departId = that.settings.departId;
                option.postData.departDesc =  $(that.element).find('#remarkEditor .summernote').summernote('code');
            }
            option.postData.fileId = that._fileId;

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    $(that.element).find('#remarkEditor .summernote').summernote('destroy');
                    that.settings.isPreviewBack = false;
                    that.init();
                }else {
                    S_layer.error(response.info);
                }
            });
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
