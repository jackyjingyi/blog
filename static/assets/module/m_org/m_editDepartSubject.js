/**
 *   组织－组织架构-编辑课题介绍
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editDepartSubject",
        defaults = {
            projectId: null,//组织信息对象
            departId:null,
            styleType:'1',
            isPreviewBack:false,
            leftExplainDesc:null,
            rightExplainDesc:null,
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._styleType = this.settings.styleType;
        this._data = null;
        this._currentCompanyId = window.currentCompanyId;
        this._currTreeObj = null;
        this._cdnUrl = window.cdnUrl;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            if(that.settings.isPreviewBack){
                that._leftExplainDesc = that.settings.leftExplainDesc;
                that._data = that.settings.data;
                that._data.processName = that._data.projectName.substr(0,100);
                that._styleType = that.settings.styleType;
                that._renderHtml();
                that._bindActionClick();
                that._bindBackTolast();
                that._save_validate();

            }else{
                that.getTaskDetails(function (data) {
                    that._leftExplainDesc = data.leftExplainDesc;
                    that._rightExplainDesc = data.rightExplainDesc;
                    that._styleType = data.styleType;
                    that._data = data;
                    that._renderHtml();
                    that._bindActionClick();
                    that._bindBackTolast();
                    that._save_validate();
                })
            }

        }
        ,getTaskDetails:function(callBack){
            var that = this;
            var option  = {};
            option.url = restApi.url_project_getTaskDetails;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
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
        , _renderHtml: function () {
            var that = this;
            var html = template('m_org/m_editDepartSubject', {
                styleType:that._styleType,
                data:that._data
            });
            $(that.element).html(html);

            $(that.element).find('#remarkEditorLeft').m_text_editor({
                isVideo:false,
                isPicture:true,
                height:1080,
                onInit:function () {
                    $(that.element).find('#remarkEditorLeft .summernote').summernote('code', that._leftExplainDesc?that._leftExplainDesc:'');
                }
            },true);
        }
        //渲染界面
        , reRenderHtml: function () {
            var that = this;
            that._leftExplainDesc =  $(that.element).find('#remarkEditorLeft .summernote').summernote('code');
            var html = template('m_org/m_editDepartSubject', {
                styleType:that._styleType,
                data:that._data
            });
            $(that.element).html(html);

            $(that.element).find('#remarkEditorLeft').m_text_editor({
                isVideo:false,
                isPicture:true,
                height:1080,
                onInit:function () {
                    $(that.element).find('#remarkEditorLeft .summernote').summernote('code', that._leftExplainDesc?that._leftExplainDesc:'');
                }
            },true);

        }
        //按钮事件绑定
        , _bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function () {
                var dataAction = $(this).attr('data-action');
                switch (dataAction) {
                    case 'saveDetails'://编辑详情
                        that.saveProjectSubject();
                        break;
                    case 'switchMode':
                        if(that._styleType=='1'){
                            that._styleType = '2';
                        }else{
                            that._styleType = '1';
                        }
                        that.reRenderHtml();
                        that._bindActionClick();
                        that._bindBackTolast();
                        break;
                    case 'preview':
                        that.preview();
                        break;
                }
            });
        }
        //返回按钮绑定
        , _bindBackTolast: function () {
            var that = this;
            var option = {};
                $(that.element).find("a[data-action='backToLast']").on('click', function () {
                    $(that.element).find('#remarkEditorLeft .summernote').summernote('destroy');
                    if(that.settings.isEasyEdit){
                        option.projectId =that.settings. projectId;
                        option.projectName = that.settings.projectName;
                        option.departId = that.settings.departId;
                        option.departName = that.settings.departName;
                        option.businessType = that.settings.businessType;
                        $(that.element).m_departSubjectShow(option);
                    }else{
                        option.departId = that.settings.departId;
                        option.businessType = that.settings.businessType;
                        $(that.element).m_editDepartIntroduction(option);
                    }

                });
        }
        ,_save_validate:function(){
            var that = this;
            that.limitedNnumber("#projectName", "#projectNameCount", 200);//调用函数需要传入三个参数，分别为，输入框、显示框、限制的长度（这里是9）
            that.limitedNnumber("#projectTarget", "#projectTargetCount", 500);
            that.limitedNnumber("#projectContent", "#projectContentCount", 500);
            that.limitedNnumber("#projectResult", "#projectResultCount", 500);
            that.limitedNnumber("#projectHonour", "#projectHonourCount", 500);
            that.limitedNnumber("#projectMember", "#projectMemberCount", 200);
        }
        ,limitedNnumber:function (eventBox, viewBox, textLength) {//调用函数需要传入三个参数，分别为，输入框、显示框、限制的长度
            $(document).on('input propertychange paste keyup', eventBox, function (event) {
                this.value = this.value.replace(this.value.slice(textLength), "")//超出长度的部分替换为空
                $(viewBox).html(this.value.length + "/" + textLength)
            })
        }
                //保存数据
        ,saveProjectSubject:function () {
            var that = this;
            var projectName =  $(that.element).find('textarea[name="projectName"]').val();
            if (projectName.length > 200)
            {
                S_toastr.error('课题名称超过字数限制');
                return false;
            }
            var projectTarget =  $(that.element).find('textarea[name="projectTarget"]').val();
            if (projectTarget.length > 500)
            {
                S_toastr.error('课题目标超过字数限制');
                return false;
            }
            var projectContent =  $(that.element).find('textarea[name="projectContent"]').val();
            if (projectContent.length > 500)
            {
                S_toastr.error('课题内容超过字数限制');
                return false;
            }
            var projectResult =  $(that.element).find('textarea[name="projectResult"]').val();
            if (projectResult.length > 500)
            {
                S_toastr.error('成果超过字数限制');
                return false;
            }
            var projectHonour =  $(that.element).find('textarea[name="projectHonour"]').val();
            if (projectHonour.length > 500)
            {
                S_toastr.error('荣誉超过字数限制');
                return false;
            }
            var projectMember =  $(that.element).find('textarea[name="projectMember"]').val();
            if (projectMember.length > 200)
            {
                S_toastr.error('团队成员超过字数限制');
                return false;
            }

            var option  = {};
            option.url = restApi.url_project_saveTaskDetail;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.styleType =that._styleType;
            option.postData.leftExplainDesc =  $(that.element).find('#remarkEditorLeft .summernote').summernote('code');
            option.postData.projectName = projectName;
            option.postData.projectTarget = projectTarget;
            option.postData.projectContent = projectContent;
            option.postData.projectResult = projectResult;
            option.postData.projectHonour = projectHonour;
            option.postData.projectMember = projectMember;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    $(that.element).find('#remarkEditorLeft .summernote').summernote('destroy');
                    that.settings.isPreviewBack = false;
                    that.init();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,preview:function(){
            var option = {}, that = this;
            option.projectId = that.settings.projectId;
            option.departId = that.settings.departId;
            option.businessType = that.settings.businessType;
            option.styleType = that._styleType,
            option.isEasyEdit = that.settings.isEasyEdit,
            option.data = {};
            option.data.projectName = $(that.element).find('textarea[name="projectName"]').val();
            option.data.projectTarget = $(that.element).find('textarea[name="projectTarget"]').val();
            option.data.projectContent = $(that.element).find('textarea[name="projectContent"]').val();
            option.data.projectResult = $(that.element).find('textarea[name="projectResult"]').val();
            option.data.projectHonour = $(that.element).find('textarea[name="projectHonour"]').val();
            option.data.projectMember = $(that.element).find('textarea[name="projectMember"]').val();

            option.leftExplainDesc =  $(that.element).find('#remarkEditorLeft .summernote').summernote('code');
            $(that.element).find('#remarkEditorLeft .summernote').summernote('destroy');
            $(that.element).m_editDepartSubjectPreview(option);
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
