/**
 * 商务秘书规则设置
 * Created by wrb on 2019/4/24.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_set_operator_rule",
        defaults = {
            isDialog:true,
            ruleType: 1//1.商务秘书选择规则，2.项目负责人选择规则
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;
        this._fastdfsUrl = window.fastdfsUrl;

        this._userList = [];//人员选项

        this._title = '经营';

        if(this.settings.ruleType==2)
            this._title = '设计';

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_role/m_role_set_operator_rule', {title:that._title,ruleType:that.settings.ruleType});
            that.renderDialog(html,function () {

                that.initICheck();
                that.initSelect2();
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||that._title+'负责人规则设置',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var type =  $(that.element).find('input[name="iCheck"]:checked').attr('data-type');
                        var companyUserList = $(that.element).find('select[name="companyUser'+type+'"]').val();

                        if(isNullOrBlank(companyUserList)){
                            S_toastr.error('请选择人员！');
                            return false;
                        }else{
                            that.save()
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

                var type = $(this).attr('data-type');
                $(that.element).find('.panel[data-type]').hide();
                $(that.element).find('.panel[data-type="'+type+'"]').show();

            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {

                $(this).iCheck('check');

            };
            $(that.element).find('input[name="iCheck"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        ,initSelect2:function () {
            var that = this;
            var placeholder = '请选择'+that._title+'负责人';

            var renderSelect = function (data,type) {

                var $select = $(that.element).find('select[name="companyUser'+type+'"]');
                $select.select2({
                    placeholder: placeholder,
                    language: "zh-CN",
                    width:'100%',
                    containerCssClass:'select-sm',
                    minimumResultsForSearch: Infinity,
                    data:data
                });
                if(type==2){
                    $select.next().find('.select2-search__field').css({'width':'100%','cursor':'pointer'});
                    $select.on('select2:opening select2:closing', function( event ) {
                        var $searchField = $(this).parent().find('.select2-search__field');
                        $searchField.prop('disabled', true);
                    });

                }
            };

            var option = {};
            option.url = restApi.url_getOperatorRoleUser;

            if(that.settings.ruleType==2){
                option.url = restApi.url_getDesignRoleUser;
            }

            option.postData = {};
            option.postData.ruleType = that.settings.ruleType;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var staffArr = [];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.userName
                            });
                        });
                    }else{
                        S_layer.warning('请先在权限界面设置'+that._title+'负责人！');
                    }

                    renderSelect(staffArr,1);
                    renderSelect(staffArr,2);
                    that.initData();

                } else {
                    S_layer.error(response.info);
                }
            });


        }
        ,initData:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getRuleByType;
            option.postData = {};
            option.postData.ruleType = that.settings.ruleType;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(response.data && response.data.length>0){
                        $.each(response.data,function (i,item) {

                            if(item.selected==1)
                                $(that.element).find('input[name="iCheck"][data-type="'+item.ruleSelectValue+'"]').iCheck('check');


                            if(item.companyUserList!=null && item.companyUserList.length>0){
                                var list = [];
                                $.each(item.companyUserList,function (i,item) {
                                    list.push(item.companyUserId);
                                });
                                $(that.element).find('select[name="companyUser'+item.ruleSelectValue+'"]').val(list).trigger('change');
                            }


                        })
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveRule;
            option.postData = {};
            option.postData.ruleType = that.settings.ruleType;

            var type =  $(that.element).find('input[name="iCheck"]:checked').attr('data-type');
            var companyUserList = $(that.element).find('select[name="companyUser'+type+'"]').val();

            option.postData.ruleSelectValue = type;
            option.postData.companyUserList = [];
            if(typeof companyUserList === 'string'){
                option.postData.companyUserList.push(companyUserList);
            }else{
                option.postData.companyUserList = companyUserList;
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
