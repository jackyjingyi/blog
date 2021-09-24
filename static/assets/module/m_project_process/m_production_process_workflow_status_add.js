/**
 * 生产安排-流程设置-状态添加
 * Created by wrb on 2019/6/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_workflow_status_add",
        defaults = {
            isDialog:true,
            projectId:null,
            processId:null,//流程ID
            dataInfo:null,//状态信息
            statusList:null,//已选择列表
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_process/m_production_process_workflow_status_add',{dataInfo:that.settings.dataInfo});
            that.renderDialog(html,function () {
                that.initSelect2();
                that.initSelect2ByRoleType();
                that.save_validate();
            });
        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加状态',
                    area : '650px',
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        var data = $(that.element).find('form').serializeObject();
                        data.processId = that.settings.processId;
                        data.nodeName = data.stateName;//$(that.element).find('input[name="new_stateName"]').val();
                        data.stateName = undefined;

                        if(that.settings.dataInfo)
                            data = $.extend({},that.settings.dataInfo,data);

                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack(data);

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    nodeValue: {
                        required: true
                    },
                    stateName: {
                        required: true,
                        maxlength: 28
                    }
                },
                messages: {
                    nodeValue: {
                        required: '请选择系统命名!'
                    },
                    stateName: {
                        required: '请输入自定义名称!',
                        maxlength: '自定义名称不超过28位!'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
            /*$.validator.addMethod('requiredCK', function(value, element) {
                var isTrue = true;

                var text = $(element).next().find('input[name="new_stateName"]').val();
                if($.trim(text)==''){
                    isTrue = false;
                }
                return  isTrue;
            }, '请选择或输入状态名称!');*/
        }
        //视图切换
        ,initSelect2:function () {
            var that = this;

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listStatus;
            m_ajax.post(option,function (response) {
                if(response.code=='0'){

                    var resData = [];
                    $.each(response.data,function (i,o) {
                        resData.push({
                            id: o.code,
                            text: o.name
                        })
                    });

                    var selectOpt = {
                        tags:false,
                        allowClear: false,
                        //containerCssClass:'select-sm',
                        language: "zh-CN",
                        placeholder:'请选择状态序号',
                        minimumResultsForSearch: -1,
                        data:resData
                    };
                    $(that.element).find('select[name="nodeValue"]').select2(selectOpt);
                    if(that.settings.statusList && that.settings.statusList.length>0){
                        $.each(that.settings.statusList,function (i,item) {

                            if(that.settings.dataInfo && that.settings.dataInfo.nodeValue==item.nodeValue)
                                return true;

                            $(that.element).find('select[name="nodeValue"] option[value="'+item.nodeValue+'"]').prop('disabled',true);
                            $(that.element).find('select[name="nodeValue"]').select2(selectOpt);

                        });
                    }
                    var selectedVal = $(that.element).find('select[name="nodeValue"] option:not(:disabled)').eq(0).val();
                    if(that.settings.dataInfo && that.settings.dataInfo.nodeValue){
                        selectedVal = that.settings.dataInfo.nodeValue;
                    }
                    $(that.element).find('select[name="nodeValue"]').on("change", function (e) {
                        var text = $(this).find('option:selected').text();
                        $(that.element).find('input[name="stateName"]').val(text);
                    });
                    $(that.element).find('select[name="nodeValue"]').val(selectedVal).trigger('change');

                    /*var nodeNameArr = [
                        {id:'开始',text:'开始'},
                        {id:'设计',text:'设计'},
                        {id:'校对',text:'校对'},
                        {id:'审核',text:'审核'},
                        {id:'审定',text:'审定'},
                        {id:'验收',text:'验收'},
                        {id:'归档',text:'归档'},
                        {id:'完成',text:'完成'}
                    ];

                    $(that.element).find('select[name="stateName"]').m_select2_by_search({
                        type:3,
                        isCookies:false,
                        option:{
                            multiple:false,
                            minimumResultsForSearch:-1,
                            tags:false,
                            data:nodeNameArr,
                            placeholder:'请选择或输入状态名称',
                            containerCssClass:'',
                            width:'100%',
                            key:'new_stateName',
                            value:that.settings.dataInfo && that.settings.dataInfo.nodeName?that.settings.dataInfo.nodeName:null
                        },
                        renderCallBack:function () {

                        }
                    },true);*/



                }else {
                    S_layer.error(response.info);
                }
            });


        }
        //项目角色
        ,initSelect2ByRoleType:function () {
            var that = this;
            $(that.element).find('select[name="roleType"]').select2({
                allowClear: false,
                //containerCssClass:'select-sm',
                width:'100%',
                language: "zh-CN",
                minimumResultsForSearch: -1
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
