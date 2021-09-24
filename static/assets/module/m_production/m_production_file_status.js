/**
 * 生产安排-设计图纸-状态流转
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_file_status",
        defaults = {
            isDialog:true,
            title:null,
            taskId:null,
            idList:null,
            fileStatus:null,
            dataInfo:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._userList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_production/m_production_file_status',{
                fileStatus:that.settings.fileStatus
            });
            that.renderDialog(html,function () {

                that.initTaskFileCkICheck();
                that.initSelect2(that.settings.fileStatus);
                that.save_validate();
            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:that.settings.title || '状态流转',
                    area : ['750px','385px'],
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    cancel:function () {

                    },
                    ok:function () {
                        var flag = $(that.element).find('form').valid();
                        if(flag){
                            that.save();
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
        ,save:function () {
            var that = this;
            var options={};
            options.classId = that.element;
            options.url=restApi.url_projectSkyDriver_saveFileStatus;
            options.postData = $(that.element).find("form.form-horizontal").serializeObject();
            options.postData.taskId = that.settings.dataInfo.id;
            options.postData.idList = that.settings.idList;
            options.postData.projectId = that.settings.dataInfo.projectId;

            if(typeof options.postData.designUserList === 'string'){
                var list = [];
                list.push(options.postData.designUserList);
                options.postData.designUserList = list;
            }


            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,initSelect2:function (status) {

            var that = this;
            var data = [];
            if(isNullOrBlank(status))
                status = $(that.element).find('input[name="fileStatus"]:checked').val();

            if(status==1){
                data = that.settings.dataInfo.designUser.userList
            }else if(status==2){
                data = that.settings.dataInfo.checkUser.userList
            }else if(status==3){
                data = that.settings.dataInfo.examineUser.userList
            }else if(status==4){
                data = [{companyUserId:that.settings.dataInfo.personInChargeId,userName:that.settings.dataInfo.personInCharge}];
            }
            var cloneData = [];
            if(data && data.length>0){
                $.each(data,function (i,o) {
                    cloneData.push({
                        id: o.companyUserId,
                        text: o.userName
                    })
                });
            }
            if($(that.element).find('.select2-container').length>0)
                $(that.element).find('select').select2('destroy').empty();

            $(that.element).find('select[name="designUserList"]').select2({
                //tags:true,
                allowClear: true,
                multiple:true,
                language: "zh-CN",
                minimumResultsForSearch: Infinity,
                placeholder:'请选择人员',
                data: cloneData
            });
        }
        ,initTaskFileCkICheck:function () {
            var that = this;

            var ifChecked = function (e) {

            };
            var ifUnchecked = function (e) {

            };
            var ifClicked = function (e) {
                var status = $(this).val();
                that.initSelect2(status);
            };
            $(that.element).find('input[name="fileStatus"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    fileStatus: {
                        required: true
                    }
                    ,designUserList: {
                        required: true
                    }
                },
                messages: {
                    fileStatus: {
                        required: '请选择状态'
                    }
                    ,designUserList: {
                        required: '请选择人员'
                    }

                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    if(element.closest('.col-sm-10').find('.row').length>0){
                        error.appendTo(element.closest('.col-sm-10').find('.row .col-sm-10'));
                    }else{
                        error.appendTo(element.closest('.col-sm-10'));
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
