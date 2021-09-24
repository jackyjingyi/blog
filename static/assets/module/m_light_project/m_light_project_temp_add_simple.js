/**
 * 普通模板添加
 * Created by wrb on 2019/12/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_temp_add_simple",
        defaults = {
            isDialog:true,
            doType:1,//1创建模板，2=保存模板
            dataInfo:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._uploadmgrContainer = null;
        this._uuid = UUID.genV4().hexNoDelim;//targetId

        this._backgroundImage = parseInt(Math.random()*(6-1+1)+1,10);
        this._coverPath = null;

        if(this.settings.dataInfo && !isNullOrBlank(this.settings.dataInfo.backgroundImage)){
            this._backgroundImage = this.settings.dataInfo.backgroundImage;
        }
        if(this.settings.dataInfo && !isNullOrBlank(this.settings.dataInfo.coverPath)){
            this._coverPath = this.settings.dataInfo.coverPath;
        }

        this._netFileId = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_light_project/m_light_project_temp_add_simple', {
                dataInfo:that.settings.dataInfo,
                coverPath:that._coverPath,
                bgNum:that._backgroundImage
            });
            that.renderDialog(html,function () {

                that.renderUploadFile();
                that.save_validate();
                that.initGroupSelect2();
                that.bindActionClick();

            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'模板基本信息',
                    area : '600px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = $(that.element).find('form').valid();

                        if (flag) {

                            var data = {
                                projectName:$(that.element).find('input[name="projectName"]').val(),
                                groupId:$(that.element).find('select[name="groupId"]').val(),
                                backgroundImage:that._backgroundImage,
                                coverPath:that._coverPath
                            };
                            if(that.settings.doType==2){
                                //编辑模板时未重新上传封面，
                                if(that._backgroundImage && that._backgroundImage.toString().length==1 && !isNullOrBlank(that._coverPath)){
                                    delete data.backgroundImage;
                                }
                                that.save(data);
                            }else{
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack(data);
                            }
                        }else{
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
        ,initGroupSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listGroup;
            option.postData = {};
            option.postData.type = 0;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if($(that.element).find('.select2-container').length>0)
                        $(that.element).find('select[name="groupId"]').select2('destroy').empty();

                    var data = [{id:'',text:'请选择'}];
                    $.each(response.data, function (i, o) {
                        if(!isNullOrBlank(o.name)){
                            data.push({
                                id: o.id,
                                text: o.name
                            });
                        }
                    });
                    $(that.element).find('select[name="groupId"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '100%',
                        minimumResultsForSearch: Infinity,
                        //placeholder: "请选择模板分组!",
                        data: data
                    });

                    if(that.settings.dataInfo && that.settings.dataInfo.groupId){
                        $(that.element).find('select[name="groupId"]').val(that.settings.dataInfo.groupId).trigger('change');
                    }


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存
        ,save:function (data) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_saveLightProject;
            option.postData = data;
            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;


            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //上传附件
        ,renderUploadFile: function () {
            var that = this;
            $('#filePicker').m_imgUploader({
                innerHTML: '请上传封面',
                server: restApi.url_fastUploadImage,
                formData: {
                    cut_deleteGroup: that.settings.cut_deleteGroup,
                    cut_deletePath: null
                },
                loadingId: 'body',
                uploadSuccessCallback: function (file, response) {
                    that._originalFileGroup = response.data.fastdfsGroup;
                    that._originalFilePath = response.data.fastdfsPath;
                    that._originalFileName = response.data.fileName;

                    that.toCutDialog();
                    //渲染图片
                    $('.m_imgCropper .img-container').attr('src', window.fastdfsUrl + that._originalFileGroup + '/' + that._originalFilePath);


                    $(that.element).find('.title:eq(0)').addClass('hide');
                    $(that.element).find('.setArea:eq(0)').removeClass('hide');


                    //S_toastr.success(response.info);
                }
            }, true);
        }
        //调到裁剪窗口
        ,toCutDialog: function () {
            var that = this;
            var headImg = null;
            $('body').m_imgCropper({
                showDialog: true,
                title:'上传封面',
                thumbnailPreviewClass:'thumbnail-preview-1',
                zoomWidth: 240,
                zoomHeight: 120,
                originalFileGroup: that._originalFileGroup,
                originalFilePath: that._originalFilePath,
                originalFileName: that._originalFileName,
                cut_deletePath: headImg,
                cropper: {
                    options: {
                        aspectRatio: 240 / 120,
                        preview: '.img-preview',
                        zoomable: false,
                        minCropBoxWidth: 200,
                        minCropBoxHeight: 200
                    }
                },
                croppedCallback: function (data) {
                    var path = window.fastdfsUrl + data.fastdfsGroup + '/' + data.fastdfsPath;
                    $(that.element).find('.project-temp-cover').attr('src',path);
                    that._backgroundImage = data.netFileId;
                    that._coverPath = path;
                }
            });
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                ignore : [],
                rules: {
                    projectName:{
                        required: true
                    }

                },
                messages: {
                    projectName:{
                        required: '请输入任务名称'
                    }

                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'editGroup'://创建分组

                        $this.m_floating_popover({
                            content: '<div class="add-group"></div>',
                            placement: 'bottomRight',
                            popoverClass:'z-index-layer',
                            renderedCallBack: function ($popover) {
                                $popover.find('.add-group').m_input_save({
                                    isDialog:false,
                                    postData:{type:1},
                                    postUrl:restApi.url_lightProject_saveTemplateGroup,
                                    fieldKey:'groupName',
                                    fieldName:'分组名称',
                                    saveCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                        that.initGroupSelect2();
                                    },
                                    cancelCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                    }

                                });
                            }
                        }, true);
                        break;
                }
                return false;
            });
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
