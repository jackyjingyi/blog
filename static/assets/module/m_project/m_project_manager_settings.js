/**
 * 指定商务秘书 项目负责人
 * Created by wrb on 2020/3/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_manager_settings",
        defaults = {
            isDialog:true,
            projectId:null,//项目Id
            selectedAssistCallBack:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        //选择的助理对象
        this._operatorAssist = {};
        this._designAssist = {};

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project/m_project_manager_settings', {isDialog:that.settings.isDialog});
            that.renderDialog(html,function () {

                that.initOperatorManagerSelect2();
                that.initDesignManagerSelect2();

                $(that.element).find('input[name="operatorAssist"]').on('click',function () {

                    that.selectAssist('operatorAssist');
                });
                $(that.element).find('input[name="designAssist"]').on('click',function () {

                    that.selectAssist('designAssist');
                });

            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'指定商务秘书及项目负责人',
                    area : '800px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        //console.log(that._operatorAssist);
                        //console.log(that._designAssist);

                        var $operatorManager = $(that.element).find('select[name="operatorManager"]');
                        if(isNullOrBlank($operatorManager.val())){
                            S_toastr.error('请选择商务秘书！');
                            return false;
                        }
                        var $designManager = $(that.element).find('select[name="designManager"]');
                        if(isNullOrBlank($designManager.val())){
                            S_toastr.error('请选项目负责人！');
                            return false;
                        }

                        var operatorManagerData = $operatorManager.select2('data');
                        var operatorManager = {
                            companyUserId:operatorManagerData[0].id,
                            userName:operatorManagerData[0].text,
                            companyUserName:operatorManagerData[0].text
                        };

                        var designManagerData = $designManager.select2('data');
                        var designManager = {
                            companyUserId:designManagerData[0].id,
                            userName:designManagerData[0].text,
                            companyUserName:designManagerData[0].text
                        };
                        var operatorAssist = {};
                        if(typeof that._operatorAssist === 'object' && that._operatorAssist.id!=null){
                            operatorAssist = {
                                companyUserId:that._operatorAssist.id,
                                userName:that._operatorAssist.userName,
                                companyUserName:that._operatorAssist.userName
                            }
                        }
                        var designAssist = {};
                        if(typeof that._designAssist === 'object' && that._designAssist.id!=null){
                            designAssist = {
                                companyUserId:that._designAssist.id,
                                userName:that._designAssist.userName,
                                companyUserName:that._designAssist.userName
                            }
                        }
                        var data = {
                            operatorManager:operatorManager,
                            designManager:designManager,
                            operatorAssist:operatorAssist,
                            designAssist:designAssist
                        };
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack(data);
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
        //商务秘书select2
        ,initOperatorManagerSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listOperatorManager;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {

                    var data = [{id:'',text:'请选择商务秘书'}];
                    $.each(response.data, function (i, o) {
                        data.push({
                            id: o.id,
                            text: o.userName
                        });
                    });
                    $(that.element).find('select[name="operatorManager"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '100%',
                        minimumResultsForSearch: Infinity,
                        placeholder: "请选择商务秘书!",
                        data: data
                    });

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //项目负责人select2
        ,initDesignManagerSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listDesignManager;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {

                    var data = [{id:'',text:'请选择项目负责人'}];
                    $.each(response.data, function (i, o) {
                        data.push({
                            id: o.id,
                            text: o.userName
                        });
                    });
                    $(that.element).find('select[name="designManager"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '100%',
                        minimumResultsForSearch: Infinity,
                        placeholder: "请选择项目负责人!",
                        data: data
                    });

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,selectAssist:function (key) {
            var that = this;
            var selectedUserList = [];
            var _key = '_'+key;
            if(typeof that[_key] === 'object' && that[_key].id!=null){
                selectedUserList.push(that[_key]);
            }

            var options = {};
            options.isASingleSelectUser = true;
            options.title = '选择助理';
            options.selectedUserList = selectedUserList;
            options.isOkSave = true;
            options.saveCallback = function (data, $ele) {
               console.log(data);
               if(data && data.selectedUserList && data.selectedUserList.length>0){
                   that[_key] = data.selectedUserList[0];
                   $(that.element).find('input[name="'+key+'"]').val(data.selectedUserList[0].userName);
               }else{
                   that[_key] = {};
                   $(that.element).find('input[name="'+key+'"]').val('');
               }
               if(that.settings.selectedAssistCallBack)
                   that.settings.selectedAssistCallBack(_key,that[_key]);

            };
            $('body').m_orgByTree(options);
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
