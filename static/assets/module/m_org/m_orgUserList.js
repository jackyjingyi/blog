/**
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_orgUserList",
        defaults = {
            doType:1,//1=组织架构，2=通讯录
            orgId:'',//必传参数
            currOrgTreeObj:null,
            orgUserList:[],
            isEdit:false,
            trClickCallBack:null,//行点击事件
            deleteBtnCallBack:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._filterData = {};
        this._dataList = [];
        this._isHadRole=window.currentRoleCodes.indexOf('20210102')>-1?true:false,

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            this.initUserData();
        }
        //人员数据并加载模板
        ,initUserData:function () {

            var that = this;
            var option  = {};
            option.classId = that.element;
            //option.url = restApi.url_getOrgUserNoPage+'/'+that.settings.orgId;
            option.url = restApi.url_getOrgUserNoPage;
            option.postData = {};
            option.postData.orgId = that.settings.orgId;
            option.postData = $.extend({}, option.postData, that._filterData);

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._dataList = response.data;
                    var $data = {};
                    $data.orgUserList = response.data;
                    that.settings.orgUserList = response.data;
                    $data.isEdit = that.settings.isEdit;
                    var html = template('m_org/m_orgUserList',$data);
                    $(that.element).html(html);
                    rolesControl();
                    that.bindTrActionClick();
                    that.bindActionClick();
                    that.sortActionClick();
                    if(that.settings.doType==1){
                        that.bindSortable();
                    }

                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(response.data);
                }else {
                    S_layer.error(response.info);
                }

            })

        }
        //tr绑定事件
        ,bindTrActionClick:function () {
            var that = this;

            $(that.element).find('tr.userListTr').click(function (event) {
                if(that.settings.isEdit){
                    if(!($(event.target).closest('.btnReturnFalse').length>0)){
                        $(this).next().toggle();
                        if($(this).find('.td-first .fa-plus-square').length>0){
                            $(this).find('.td-first .fa').removeClass('fa-plus-square').addClass('fa-minus-square');
                        }else{
                            $(this).find('.td-first .fa').removeClass('fa-minus-square').addClass('fa-plus-square');
                        }
                        if(that.settings.trClickCallBack)
                            that.settings.trClickCallBack();
                        return false;
                    }
                }else{
                    if(that._isHadRole){//有权限的人才能看个人效能
                        //查看个人能效
                        var id =  $(this).attr('data-id');
                        that.lookOutputStatis(id,function (dataItem) {
                            $('body').m_stats_user_output_details({dataInfo:dataItem});
                        });
                        return false;
                    }
                }

            });
        }
        //编辑人员
        ,editOrgUser:function (i) {

            var that = this;
            var options = {};
            options.companyId = that.settings.currOrgTreeObj.companyId;
            options.realId = that.settings.currOrgTreeObj.realId;
            options.dataInfo = that.settings.orgUserList[i];
            options.doType = 'edit';//等于edit是编辑
            $('body').m_editUser(options);
        }
        //向上排序
        ,upSorting:function (i) {
            var that = this;
            var option  = {};
            option.url = restApi.url_orderCompanyUser;

            var param = {};
            param.companyUser1 = that.settings.orgUserList[i-0];
            param.companyUser2 = that.settings.orgUserList[i-0-1];
            param.orgId = that.settings.orgId;
            option.postData = param;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                   /* S_layer.tips('操作成功！');*/
                    that.initUserData();
                }else {
                    S_layer.error(response.info);
                }

            })
        }
        //向下排序
        ,downSorting:function (i) {
            var that = this;
            var option  = {};
            option.url = restApi.url_orderCompanyUser;

            var param = {};
            param.companyUser1 = that.settings.orgUserList[i-0];
            param.companyUser2 = that.settings.orgUserList[i-0+1];
            param.orgId = that.settings.orgId;
            option.postData = param;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                   /* S_layer.tips('操作成功！');*/
                    that.initUserData();
                }else {
                    S_layer.error(response.info);
                }

            })
        }
        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;

            $('.orgUserOBox a[data-action]').on('click',function () {
                var _this = this;
                var dataAction = $(this).attr('data-action');
                if(dataAction=='editOrgUser'){//编辑人员
                    that.editOrgUser($(this).attr('data-i'));
                    return false;
                }else if(dataAction=='upSorting'){//向上排序
                    that.upSorting($(this).attr('data-i'));
                    return false;
                }else if(dataAction=='downSorting'){//向下排序
                    that.downSorting($(this).attr('data-i'));
                    return false;
                }else if(dataAction=='delOrgUser'){//删除人员

                    S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                        var option = {};
                        var id = $(_this).attr('data-id');
                        option.url = restApi.url_saveCompanyUser + '/' + id;
                        m_ajax.get(option, function (response) {
                            if (response.code == '0') {
                                S_toastr.success('删除成功！');
                                that.initUserData();
                            } else {
                                S_layer.error(response.info);
                            }
                        });

                    }, function () {
                    });
                    return false;
                }
            });
        }
        //排序
        ,sortActionClick:function () {
            var that = this;
            $(that.element).find('th[data-action="sort"]').each(function () {
                var $this = $(this),code = $this.attr('data-code');
                code = code+'Order';
                var sortField = that._filterData[code];
                var sortClass = '';
                if(sortField=='0'){
                    sortClass = 'sorting_asc';
                }else if(sortField=='1'){
                    sortClass = 'sorting_desc';
                }else{
                    sortClass = 'sorting';
                }
                $this.removeClass('sorting_asc sorting_desc sorting').addClass(sortClass);
                $this.off('click').on('click',function (e) {

                    $(that.element).find('th[data-action="sort"]').each(function () {
                        var iCode =  $(this).attr('data-code') + 'Order';
                        if(code!=iCode){
                            that._filterData[iCode] = null;
                            $(this).removeClass().addClass('sorting');
                        }
                    });
                    if($this.hasClass('sorting')||$this.hasClass('sorting_asc')){
                        that._filterData[code] = '1';
                        sortClass = 'sorting_desc';
                    }
                    else if($this.hasClass('sorting_desc')){
                        that._filterData[code] = '0';
                        sortClass = 'sorting_asc';
                    }else{
                        sortClass = 'sorting';
                    }

                    $this.removeClass().addClass(sortClass);

                    that.initUserData();

                    e.stopPropagation();
                    return false;
                });
            });
        }
        //已选自定义属性排序拖拽
        ,bindSortable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('sortItemBox'), {
                animation: 200,
                handle: '.userListTr',
                sort: true,
                dataIdAttr: 'data-sort-id',
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                onAdd: function (evt){ //拖拽时候添加有新的节点的时候发生该事件
                    //console.log('onAdd.foo:', [evt.item, evt.from]);
                },
                onUpdate: function (evt){ //拖拽更新节点位置发生该事件
                    //console.log('onUpdate.foo:', [evt.item, evt.from]);
                },
                onRemove: function (evt){ //删除拖拽节点的时候促发该事件
                    //console.log('onRemove.foo:', [evt.item, evt.from]);
                },
                onStart:function(evt){ //开始拖拽出发该函数
                    //console.log('onStart.foo:', [evt.item, evt.from]);
                    $(that.element).find('tr.userInfoTr').hide();
                },
                onSort:function(evt){ //发生排序发生该事件
                    //console.log('onSort.foo:', [evt.item, evt.from]);
                },
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt);
                    that.sortSave();
                }
            });

        }
        //排序保存
        ,sortSave:function () {
            var that = this;
            var option  = {};
            option.url = restApi.url_batchOrderCompanyUser;
            option.postData = {};
            option.postData.orgId = that.settings.orgId;
            option.postData.orgUserList = [];

            $(that.element).find('tr.userListTr').each(function (i) {
                option.postData.orgUserList.push($(this).attr('data-org-userid'));
            });

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_layer.tips('操作成功！');
                    that.init();
                }else {
                    S_layer.error(response.info);
                }

            })
        }
        //查看个人能效
        ,lookOutputStatis:function (id,callback) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_personalOutputStatic;
            option.postData = {userId:id};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(response.data==null){
                        S_layer.warning('该人员暂无个人能效');
                    }else if(callback){
                        callback(response.data);
                    }

                }else {
                    S_layer.error(response.info);
                }
            })


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
